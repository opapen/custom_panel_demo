from homeassistant.core import HomeAssistant

async def async_setup(hass: HomeAssistant, config: dict):
    panel_url_path = "/custom-panel-demo"
    panel_local_dir = hass.config.path("www/custom_panel_demo_panel")

    hass.http.register_static_path(
        panel_url_path,
        panel_local_dir,
        cache_headers=False
    )

    hass.components.frontend.async_register_built_in_panel(
        component_name="iframe",
        sidebar_title="Custom Panel Demo",
        sidebar_icon="mdi:view-dashboard",
        frontend_url_path="custom-panel-demo",
        config={"url": f"{panel_url_path}/index.html"},
        require_admin=True
    )

    return True
