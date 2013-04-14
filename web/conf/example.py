"""
Settings for the example app.
"""

# add this app to installed apps if it's not in there already
if not 'apps.example' in INSTALLED_APPS:
    INSTALLED_APPS += ('apps.example',)
