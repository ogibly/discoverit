"""
AWX Tower integration service for running Ansible playbooks.
"""
import requests
import json
import tempfile
import os
from typing import List, Dict, Any, Optional
from datetime import datetime


class AWXService:
    def __init__(self, awx_url: str, username: str, password: str):
        self.awx_url = awx_url.rstrip('/')
        self.username = username
        self.password = password
        self.token = None
        self.token_expires = None

    def _get_auth_token(self) -> str:
        """Get or refresh AWX authentication token."""
        if self.token and self.token_expires and datetime.utcnow() < self.token_expires:
            return self.token

        auth_url = f"{self.awx_url}/api/v2/tokens/"
        auth_data = {
            "username": self.username,
            "password": self.password
        }

        try:
            response = requests.post(auth_url, json=auth_data, timeout=30)
            response.raise_for_status()
            
            token_data = response.json()
            self.token = token_data['token']
            # Set token expiration (AWX tokens typically last 1 hour)
            self.token_expires = datetime.utcnow().timestamp() + 3600
            
            return self.token
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to authenticate with AWX: {e}")

    def _get_headers(self) -> Dict[str, str]:
        """Get headers with authentication token."""
        token = self._get_auth_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def create_inventory(self, name: str, assets: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create an Ansible inventory from assets."""
        inventory_data = {
            "name": name,
            "description": f"Auto-generated inventory for {len(assets)} assets",
            "organization": 1,  # Default organization
            "variables": json.dumps({
                "ansible_ssh_common_args": "-o StrictHostKeyChecking=no"
            })
        }

        try:
            # Create inventory
            response = requests.post(
                f"{self.awx_url}/api/v2/inventories/",
                json=inventory_data,
                headers=self._get_headers(),
                timeout=30
            )
            response.raise_for_status()
            inventory = response.json()

            # Create hosts
            for asset in assets:
                host_data = {
                    "name": asset.get('name', asset.get('primary_ip', 'unknown')),
                    "inventory": inventory['id'],
                    "variables": json.dumps({
                        "ansible_host": asset.get('primary_ip'),
                        "ansible_user": asset.get('username'),
                        "ansible_ssh_private_key_file": asset.get('ssh_key_path'),
                        "hostname": asset.get('hostname'),
                        "mac_address": asset.get('mac_address'),
                        "os_name": asset.get('os_name'),
                        "manufacturer": asset.get('manufacturer'),
                        "model": asset.get('model')
                    })
                }

                host_response = requests.post(
                    f"{self.awx_url}/api/v2/hosts/",
                    json=host_data,
                    headers=self._get_headers(),
                    timeout=30
                )
                host_response.raise_for_status()

            return inventory

        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to create AWX inventory: {e}")

    def create_job_template(self, name: str, playbook_name: str, inventory_id: int, 
                          extra_vars: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a job template for running playbooks."""
        template_data = {
            "name": name,
            "description": f"Auto-generated job template for {playbook_name}",
            "job_type": "run",
            "inventory": inventory_id,
            "project": 1,  # Default project
            "playbook": playbook_name,
            "ask_variables_on_launch": True,
            "ask_inventory_on_launch": False,
            "ask_credential_on_launch": True,
            "extra_vars": json.dumps(extra_vars or {})
        }

        try:
            response = requests.post(
                f"{self.awx_url}/api/v2/job_templates/",
                json=template_data,
                headers=self._get_headers(),
                timeout=30
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to create AWX job template: {e}")

    def launch_job(self, job_template_id: int, inventory_id: int, 
                   extra_vars: Optional[Dict[str, Any]] = None,
                   credentials: Optional[List[int]] = None) -> Dict[str, Any]:
        """Launch a job from a job template."""
        job_data = {
            "job_template": job_template_id,
            "inventory": inventory_id,
            "extra_vars": json.dumps(extra_vars or {}),
            "credentials": credentials or []
        }

        try:
            response = requests.post(
                f"{self.awx_url}/api/v2/job_templates/{job_template_id}/launch/",
                json=job_data,
                headers=self._get_headers(),
                timeout=30
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to launch AWX job: {e}")

    def get_job_status(self, job_id: int) -> Dict[str, Any]:
        """Get the status of a running job."""
        try:
            response = requests.get(
                f"{self.awx_url}/api/v2/jobs/{job_id}/",
                headers=self._get_headers(),
                timeout=30
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to get AWX job status: {e}")

    def get_job_output(self, job_id: int) -> str:
        """Get the output/logs of a job."""
        try:
            response = requests.get(
                f"{self.awx_url}/api/v2/jobs/{job_id}/stdout/",
                headers=self._get_headers(),
                timeout=30
            )
            response.raise_for_status()
            return response.text

        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to get AWX job output: {e}")

    def cancel_job(self, job_id: int) -> bool:
        """Cancel a running job."""
        try:
            response = requests.post(
                f"{self.awx_url}/api/v2/jobs/{job_id}/cancel/",
                headers=self._get_headers(),
                timeout=30
            )
            response.raise_for_status()
            return True

        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to cancel AWX job: {e}")

    def run_playbook_on_assets(self, playbook_name: str, assets: List[Dict[str, Any]], 
                              extra_vars: Optional[Dict[str, Any]] = None,
                              job_name: Optional[str] = None) -> Dict[str, Any]:
        """Run a playbook on a list of assets."""
        if not assets:
            raise ValueError("No assets provided")

        # Create inventory
        inventory_name = f"temp_inventory_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        inventory = self.create_inventory(inventory_name, assets)

        try:
            # Create job template
            template_name = f"temp_template_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            job_template = self.create_job_template(
                template_name, 
                playbook_name, 
                inventory['id'], 
                extra_vars
            )

            # Launch job
            job = self.launch_job(job_template['id'], inventory['id'], extra_vars)

            return {
                "job_id": job['id'],
                "job_url": f"{self.awx_url}/#/jobs/playbook/{job['id']}",
                "inventory_id": inventory['id'],
                "template_id": job_template['id'],
                "status": job['status']
            }

        except Exception as e:
            # Clean up on error
            try:
                self._cleanup_resources(inventory['id'], job_template.get('id'))
            except:
                pass
            raise e

    def _cleanup_resources(self, inventory_id: int, template_id: Optional[int] = None):
        """Clean up temporary resources."""
        try:
            # Delete inventory
            requests.delete(
                f"{self.awx_url}/api/v2/inventories/{inventory_id}/",
                headers=self._get_headers(),
                timeout=30
            )
        except:
            pass

        if template_id:
            try:
                # Delete job template
                requests.delete(
                    f"{self.awx_url}/api/v2/job_templates/{template_id}/",
                    headers=self._get_headers(),
                    timeout=30
                )
            except:
                pass

    def test_connection(self) -> bool:
        """Test connection to AWX Tower."""
        try:
            self._get_auth_token()
            response = requests.get(
                f"{self.awx_url}/api/v2/me/",
                headers=self._get_headers(),
                timeout=10
            )
            response.raise_for_status()
            return True
        except:
            return False
