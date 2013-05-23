"""
Settings for the {{app_name}} app.
"""

# add this app to installed apps if it's not in there already
if not 'apps.{{app_name}}' in INSTALLED_APPS:
    INSTALLED_APPS += ('apps.{{app_name}}',)

{% if is_dbvcs_installed %}
# add this app to the dbvcs apps if it's not in there already
if not 'apps.{{app_name}}' in DBVCS_APPS:
    DBVCS_APPS += ('apps.{{app_name}}',)
{% endif %}
