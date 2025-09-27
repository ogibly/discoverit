"""
Webhook service for external integrations and event notifications.
"""
import asyncio
import aiohttp
import json
import hmac
import hashlib
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from ..models import Webhook, WebhookDelivery
from ..schemas import WebhookCreate, WebhookUpdate
from .base_service import BaseService


class WebhookService(BaseService):
    def __init__(self, db: Session):
        super().__init__(db)

    def get_webhooks(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Webhook]:
        """Get webhooks with filtering."""
        query = self.db.query(Webhook)
        
        if is_active is not None:
            query = query.filter(Webhook.is_active == is_active)
        
        return query.order_by(Webhook.created_at.desc()).offset(skip).limit(limit).all()

    def get_webhook(self, webhook_id: int) -> Optional[Webhook]:
        """Get a webhook by ID."""
        return self.db.query(Webhook).filter(Webhook.id == webhook_id).first()

    def create_webhook(
        self,
        webhook_data: WebhookCreate,
        user_id: Optional[int] = None
    ) -> Webhook:
        """Create a new webhook."""
        webhook = Webhook(
            name=webhook_data.name,
            url=webhook_data.url,
            events=webhook_data.events,
            secret=webhook_data.secret,
            retry_count=webhook_data.retry_count,
            timeout_seconds=webhook_data.timeout_seconds,
            created_by=user_id
        )
        
        self.db.add(webhook)
        self.db.commit()
        self.db.refresh(webhook)
        return webhook

    def update_webhook(
        self,
        webhook_id: int,
        webhook_data: WebhookUpdate
    ) -> Optional[Webhook]:
        """Update a webhook."""
        webhook = self.get_webhook(webhook_id)
        if not webhook:
            return None
        
        update_data = webhook_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(webhook, field, value)
        
        self.db.commit()
        self.db.refresh(webhook)
        return webhook

    def delete_webhook(self, webhook_id: int) -> bool:
        """Delete a webhook."""
        webhook = self.get_webhook(webhook_id)
        if not webhook:
            return False
        
        self.db.delete(webhook)
        self.db.commit()
        return True

    def get_webhook_deliveries(
        self,
        webhook_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[WebhookDelivery]:
        """Get webhook delivery history."""
        return self.db.query(WebhookDelivery).filter(
            WebhookDelivery.webhook_id == webhook_id
        ).order_by(WebhookDelivery.created_at.desc()).offset(skip).limit(limit).all()

    async def trigger_webhook(
        self,
        webhook: Webhook,
        event_type: str,
        payload: Dict[str, Any]
    ) -> WebhookDelivery:
        """Trigger a webhook delivery."""
        # Create delivery record
        delivery = WebhookDelivery(
            webhook_id=webhook.id,
            event_type=event_type,
            payload=payload,
            success=False
        )
        self.db.add(delivery)
        self.db.commit()
        self.db.refresh(delivery)
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "DiscoverIT-Webhook/1.0"
        }
        
        # Add signature if secret is provided
        if webhook.secret:
            signature = self._generate_signature(webhook.secret, payload)
            headers["X-Webhook-Signature"] = f"sha256={signature}"
        
        # Send webhook
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook.url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=webhook.timeout_seconds)
                ) as response:
                    delivery.response_status = response.status
                    delivery.response_body = await response.text()
                    delivery.success = 200 <= response.status < 300
                    delivery.delivered_at = datetime.utcnow()
                    
                    if delivery.success:
                        webhook.success_count += 1
                    else:
                        webhook.failure_count += 1
                        delivery.error_message = f"HTTP {response.status}: {delivery.response_body}"
                    
                    webhook.last_triggered = datetime.utcnow()
                    
        except Exception as e:
            delivery.error_message = str(e)
            webhook.failure_count += 1
            webhook.last_triggered = datetime.utcnow()
        
        self.db.commit()
        return delivery

    async def trigger_webhooks_for_event(
        self,
        event_type: str,
        payload: Dict[str, Any]
    ) -> List[WebhookDelivery]:
        """Trigger all webhooks that are configured for the given event."""
        webhooks = self.db.query(Webhook).filter(
            Webhook.is_active == True,
            Webhook.events.contains([event_type])
        ).all()
        
        deliveries = []
        for webhook in webhooks:
            delivery = await self.trigger_webhook(webhook, event_type, payload)
            deliveries.append(delivery)
        
        return deliveries

    def _generate_signature(self, secret: str, payload: Dict[str, Any]) -> str:
        """Generate HMAC signature for webhook payload."""
        payload_str = json.dumps(payload, sort_keys=True)
        signature = hmac.new(
            secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature

    def get_webhook_stats(self, webhook_id: int) -> Dict[str, Any]:
        """Get webhook statistics."""
        webhook = self.get_webhook(webhook_id)
        if not webhook:
            return {}
        
        deliveries = self.db.query(WebhookDelivery).filter(
            WebhookDelivery.webhook_id == webhook_id
        ).all()
        
        total_deliveries = len(deliveries)
        successful_deliveries = len([d for d in deliveries if d.success])
        failed_deliveries = total_deliveries - successful_deliveries
        
        # Get recent delivery status
        recent_deliveries = deliveries[-10:] if deliveries else []
        recent_success_rate = (
            len([d for d in recent_deliveries if d.success]) / len(recent_deliveries) * 100
        ) if recent_deliveries else 0
        
        return {
            "webhook_id": webhook_id,
            "total_deliveries": total_deliveries,
            "successful_deliveries": successful_deliveries,
            "failed_deliveries": failed_deliveries,
            "success_rate": (successful_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0,
            "recent_success_rate": recent_success_rate,
            "last_triggered": webhook.last_triggered,
            "average_response_time": self._calculate_average_response_time(deliveries)
        }

    def _calculate_average_response_time(self, deliveries: List[WebhookDelivery]) -> Optional[float]:
        """Calculate average response time for webhook deliveries."""
        successful_deliveries = [d for d in deliveries if d.success and d.delivered_at]
        if not successful_deliveries:
            return None
        
        total_time = 0
        for delivery in successful_deliveries:
            if delivery.delivered_at:
                response_time = (delivery.delivered_at - delivery.created_at).total_seconds()
                total_time += response_time
        
        return total_time / len(successful_deliveries)

    def retry_failed_delivery(self, delivery_id: int) -> Optional[WebhookDelivery]:
        """Retry a failed webhook delivery."""
        delivery = self.db.query(WebhookDelivery).filter(
            WebhookDelivery.id == delivery_id
        ).first()
        
        if not delivery or delivery.success:
            return None
        
        webhook = self.get_webhook(delivery.webhook_id)
        if not webhook or not webhook.is_active:
            return None
        
        # Create new delivery record for retry
        new_delivery = WebhookDelivery(
            webhook_id=webhook.id,
            event_type=delivery.event_type,
            payload=delivery.payload,
            attempt_count=delivery.attempt_count + 1,
            success=False
        )
        self.db.add(new_delivery)
        self.db.commit()
        self.db.refresh(new_delivery)
        
        # Trigger the webhook asynchronously
        asyncio.create_task(self.trigger_webhook(webhook, delivery.event_type, delivery.payload))
        
        return new_delivery
