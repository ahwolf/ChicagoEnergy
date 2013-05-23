import sys
import urllib2
import simplejson as json

class Font(object):
    def __init__(self, item):
        self.family = item['family']
        self.kind = item['kind']
        self.subsets = item['subsets']
        self.variants = item['variants']

    def api_name(self, variant=None):

        # replace spaces with plus
        base = self.family.replace(' ', '+')

        # add variant names
        if variant is None:
            
            # if regular is the only variant, dont bother
            if len(self.variants) == 1 and self.variants[0] == 'regular':
                result = base

            # otherwise, get all variants
            else:
                result = '%s:%s' % (base, ','.join(self.variants))

        # if the requested variant is regular, dont bother
        elif variant == 'regular':
            result = base

        # only return requested variant
        else:
            result = '%s:%s' % (base, variant)

        # return the result
        return result

class GoogleFontList(list):

    font_url_template = 'http://fonts.googleapis.com/css?family=%s'
    
    def __init__(self, url_or_filename):
        list.__init__(self)

        # decorate a list with family name
        decorated = []
        for item in self.get(url_or_filename)['items']:
            decorated.append((item['family'], item))
        
        # add each font to this list
        for family, item in sorted(decorated):
            self.append(Font(item))

    def get(self, filename_like):

        # try to open the file or open the url
        try:
            input_stream = open(filename_like)
        except IOError:
            input_stream = urllib2.urlopen(filename_like)

        # load the string as a json
        mung = json.loads(input_stream.read())

        # close the "file like" thing
        input_stream.close()

        # return the dictionary that the JSON encodes
        return mung
        
    def full_url(self, n):
        return self.font_url_template % '|'.join(item.api_name() for item in self[:n])
        
if __name__ == '__main__':


    key = 'AIzaSyA_XrgM_JIRkS9Uf3jaOaqOsTA9y49TW1g'
    url = 'https://www.googleapis.com/webfonts/v1/webfonts?key=%s' % key
    filename = 'google_fonts.json'
    
    font_list = GoogleFontList(filename)
    n = 101
    print '<html>'
    print '<head>'
    print '<link rel="stylesheet" type="text/css" href="%s">' % font_list.full_url(n)
    print '<style>'
    print '.font {margin-bottom: 20px;}'
    print '.family {display: block;}'
    print '.demo {font-size: 32px;}'
    print '</style>'
    print '</head>'
    print '<body>'
    for font in font_list[:n]:
        print '<div class="font">'
        print '<span class="family">%s</span>' % font.family
        print '<span class="demo" style="font-family:%s">The quick brown fox...</span>' % font.family
        print '</div>'
    print '</body>'
    print '</html>'

    # for item in font_list:
    #     print item.api_name()
