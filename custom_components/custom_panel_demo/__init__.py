from homeassistant.components.frontend import async_register_built_in_panel

DOMAIN = "custom_panel_demo"

async def async_setup(hass, config):
    hass.http.register_static_path(
        "/custom_panel_demo_panel",
        hass.config.path("www/custom_panel_demo_panel"),
        cache_headers=False
    )

    async_register_built_in_panel(
        hass,
        component_name="iframe",  # oder "custom" falls du ein JS-basiertes Panel hast
        sidebar_title="Custom Panel",
        sidebar_icon="mdi:tools",
        frontend_url_path="custom-panel",
        config={
            "url": "/local/custom_panel_demo_panel/index.html"
        },
        require_admin=True
    )

    return True
