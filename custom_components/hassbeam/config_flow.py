"""Config flow for HassBeam integration."""
from homeassistant import config_entries
import voluptuous as vol

from .const import DOMAIN

class HassBeamConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for HassBeam."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        if user_input is not None:
            return self.async_create_entry(title="HassBeam", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Optional("debug_mode", default=False): bool,
            })
        )
