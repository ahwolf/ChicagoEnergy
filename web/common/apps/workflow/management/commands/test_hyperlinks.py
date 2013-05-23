import urllib2
import urlparse
import sys
import os
import collections
import sgmllib
import cookielib

import sys

from common.apps.workflow.management.base import BaseCommand
from common.apps.workflow.management.option_parsers import TestHyperlinksParser

class LinkParser(sgmllib.SGMLParser):
    """parse the links!"""

    def __init__(self, data, *args, **kwargs):
        sgmllib.SGMLParser.__init__(self, *args, **kwargs)

        self.links = []

        self.feed(data)
        self.close()


    def start_a(self, attributes):
        """parse all of the links"""
        for key, value in attributes:
            if key=="href":
                self.links.append(value)

    def end_a(self):
        """stop parsing all of the links"""
        pass

class SitemapLinkParser(sgmllib.SGMLParser):
    """parse the sitemap.xml"""

    def __init__(self, data, *args, **kwargs):
        sgmllib.SGMLParser.__init__(self, *args, **kwargs)

        self.links = []
        self.is_loc = False

        self.feed(data)
        self.close()

    def start_loc(self, attributes):
        self.is_loc = True

    def end_loc(self):
        self.is_loc = False

    def handle_data(self, data):
        if self.is_loc:
            self.links.append(data.strip())

class Command(BaseCommand):
    __doc__ = """
    This command can be used to test that all hyperlinks work in a
    given website. It reports on which hyperlinks are broken and gives
    a list of all e-mail addresses embedded in mailto directives.  
    """
    args = ''
    help = __doc__
    option_list = BaseCommand.option_list + \
       tuple(TestHyperlinksParser('').option_list)

    def handle(self, *args, **options):
        
        root_url = urlparse.urlparse(options['domain'])
        max_depth = options['max_depth']

        # sets of UrlParse objects to track which webpages we have crawled and
        # which we have yet to crawl
        next_page = collections.deque([root_url])
        tocrawl = set(next_page)
        crawled = set()
        depth_dict = {root_url: 0}
        link_origin = {}
        broken_links = set()

        email_address_set = set()

        # use these headers when making requests. wikipedia pays
        # particular attention to this and returns 403 errors without
        # headers
        headers = {"User-agent": "Mozilla/5.0 (X11; U; Linux i686) Gecko/20071127 Firefox/2.0.0.11"}

        # create a cookiejar so that nytimes does not redirect with
        # 301 errors. 
        cookie_jar = cookielib.CookieJar()
        opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cookie_jar))
        urllib2.install_opener(opener)

        # continue until we can't crawl no more!
        url = root_url
        while len(tocrawl)>0:

            # get the next url and update progress
            url = next_page.popleft()
            tocrawl.remove(url)
            crawled.add(url)
            if depth_dict[url]>max_depth:
                break
            print >> sys.stderr, depth_dict[url], url.geturl()

            # go to website
            request = urllib2.Request(url.geturl(), headers=headers)
            try:
                response = urllib2.urlopen(request)
            except Exception, error:
                if isinstance(error, urllib2.HTTPError):
                    if error.code in (404, 500):
                        broken_links.add(url)
                        print "BROKEN", url.geturl(), error.code
                        for origin in link_origin[url]:
                            print "\tORIGIN", origin.geturl()
                        sys.stdout.flush()
                    else:
                        print dir(error)
                        print "UNMANAGED ERROR CODE", error.code
                    continue
                elif isinstance(error, urllib2.URLError):
                    print "HOLY-SHIT", url.geturl(), error.reason
                    for origin in link_origin[url]:
                        print "\tORIGIN", origin.geturl()
                    sys.stdout.flush()
                    continue
                else: 
                    raise 

            # if this url is in the root_url domain, parse the html to find all
            # links and add those links to the 'tocrawl' set of links
            if url.netloc==root_url.netloc:
                parser = LinkParser(response.read())
                for href in parser.links:
                    href_url = urlparse.urlparse(href)
                    if href_url.scheme == "mailto":
                        if href_url.path not in email_address_set:
                            email_address_set.add(href_url.path)
                            print "EMAIL", href_url.path
                            print "\tORIGIN", url.geturl()
                            sys.stdout.flush()
                    else:
                        new_url_str = urlparse.urljoin(url.geturl(), href_url.geturl())
                        href_url = urlparse.urlparse(new_url_str)

                        # get rid of url fragments here --- they are used by
                        # the browser but they can make some servers puke out
                        # a 404 response if you pass the fragment
                        # (e.g. '#fragment-identifier-here') in the url
                        href_url_list = list(href_url)
                        href_url_list[5] = ''
                        href_url = urlparse.urlparse(urlparse.urlunparse(href_url_list))

                        # only play to visit new pages if it has NOT been
                        # crawled AND it has not already been marked to crawl
                        if href_url not in crawled and href_url not in tocrawl:
                            next_page.append(href_url)
                            tocrawl.add(href_url)
                            assert len(next_page)==len(tocrawl), "\n".join((
                                href_url.geturl(),
                                href,
                                url.geturl(),
                            ))

                    # remember where the href_url link came from (the current url)
                    try:
                        link_origin[href_url].append(url)
                    except KeyError:
                        link_origin[href_url] = [url]

                    try:
                        depth_dict[href_url] = min(depth_dict[href_url], 
                                                   depth_dict[url]+1)
                    except KeyError:
                        depth_dict[href_url] = depth_dict[url]+1

        # make sure all of the sitemap urls were processed! but only
        # if the url --depth option is NOT specified
        parser = self.create_parser('foo', 'bar')
        default = parser.get_default_values()
        if max_depth == default.max_depth:
            sitemap_url = urlparse.urlparse(
                urlparse.urljoin(root_url.geturl(), "/sitemap.xml")
            )
            request = urllib2.Request(sitemap_url.geturl(),headers=headers)
            try:
                response = urllib2.urlopen(request)
                sitemap_exists = True
            except Exception, error:
                if isinstance(error, urllib2.HTTPError):
                    sitemap_exists = False
                    pass # url sitemap url does not exist
                else:
                    raise
            if sitemap_exists:
                parser = SitemapLinkParser(response.read())
                for link in parser.links:
                    url = urlparse.urlparse(link)
                    if url not in crawled:
                        print "UNCRAWLED PAGE IN SITEMAP:", url.geturl()
