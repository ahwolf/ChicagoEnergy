import sys
import subprocess

SCSS_FONT_DIRECTORY_FILENAME = '../../_fonts.scss'

# get the names of all available fonts
font_list = []
with open(SCSS_FONT_DIRECTORY_FILENAME) as stream:
    for line in stream:
        if line.startswith('@mixin'):
            name = line.split()[1].split('(')[0]
            if not name == 'font':
                font_list.append(name)

# sort font names alphabetically
font_list.sort()

# generate scss file with font info
stream = open('allfonts.scss', 'w')
print >> stream, '@import "../../_fonts.scss";'
print >> stream, '$font_path: "../";'
for font in font_list:
    print >> stream, '@include %s($font_path);' % font
stream.close()

# compile the scss file
process = subprocess.call(['/var/lib/gems/1.8/bin/sass',
                            'allfonts.scss',
                            'allfonts.css'])

# generate HTML file with samples
stream = open('allfonts.html', 'w')
print >> stream, '<html>'
print >> stream, '<head>'
print >> stream, '<title>DsA fonts</title>'
print >> stream, '<link rel="stylesheet" type="text/css" href="allfonts.css" />'
print >> stream, '</head>'
print >> stream, '<body>'
for font in font_list:
    print >> stream, '<h1 style="font-family:%s">' % font
    print >> stream, font
    print >> stream, '</h1>'
print >> stream, '</body>'
print >> stream, '</html>'
