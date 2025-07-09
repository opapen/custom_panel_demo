from homeassistant.components.frontend import async_register_built_in_panel
import logging
_LOGGER = logging.getLogger(__name__)
_LOGGER.info("Setting up Custom Panel Demo...")


DOMAIN = "custom_panel_demo"

async def async_setup(hass, config):
    _LOGGER.info("registering path for custom panel demo")
    hass.http.register_static_path(
        "/custom_panel_demo_panel",
        hass.config.path("www/custom_panel_demo_panel"),
        cache_headers=False
    )

    async_register_built_in_panel(
        hass,
        component_name="iframe",
        sidebar_title="Custom Panel",
        sidebar_icon="mdi:tools",
        frontend_url_path="custom-panel",
        config={"url": "/local/custom_panel_demo_panel/index.html"},
        require_admin=False
    )

    return True
