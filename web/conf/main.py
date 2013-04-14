"""
Settings for the main app.
"""

# add this app to installed apps if it's not in there already
if not 'apps.main' in INSTALLED_APPS:
    INSTALLED_APPS += ('apps.main',)
