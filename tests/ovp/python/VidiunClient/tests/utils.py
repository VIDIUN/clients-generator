import os, sys, inspect
import unittest

from six.moves import configparser

from VidiunClient import VidiunClient, VidiunConfiguration
from VidiunClient.Base import VidiunObjectFactory, VidiunEnumsFactory
from VidiunClient.Base import IVidiunLogger

from VidiunClient.Plugins.Core import VidiunSessionType

generateSessionFunction = VidiunClient.generateSessionV2
# generateSessionV2() needs the Crypto module, if we don't have it, we fallback to generateSession()
try:
    from Crypto import Random
    from Crypto.Cipher import AES
except ImportError:
    generateSessionFunction = VidiunClient.generateSession

dir = os.path.dirname(__file__)
filename = os.path.join(dir, 'config.ini')

config = configparser.ConfigParser()
config.read(filename)
PARTNER_ID = config.getint("Test", "partnerId")
SERVICE_URL = config.get("Test", "serviceUrl")
ADMIN_SECRET = config.get("Test", "adminSecret")
USER_NAME = config.get("Test", "userName")

import logging
logging.basicConfig(level = logging.DEBUG,
                    format = '%(asctime)s %(levelname)s %(message)s',
                    stream = sys.stdout)

class VidiunLogger(IVidiunLogger):
    def log(self, msg):
        logging.info(msg)

def GetConfig():
    config = VidiunConfiguration()
    config.requestTimeout = 500
    config.serviceUrl = SERVICE_URL
    config.setLogger(VidiunLogger())
    return config

def getTestFile(filename, mode='rb'):
    testFileDir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
    return open(testFileDir+'/'+filename, mode)
    
    

class VidiunBaseTest(unittest.TestCase):
    """Base class for all Vidiun Tests"""
    #TODO  create a client factory as to avoid thrashing vidiun with logins...
    
    def setUp(self):
        #(client session is enough when we do operations in a users scope)
        self.config = GetConfig()
        self.client = VidiunClient(self.config)
        self.vs = generateSessionFunction(ADMIN_SECRET, USER_NAME, 
                                             VidiunSessionType.ADMIN, PARTNER_ID, 
                                             86400, "disableentitlement")
        self.client.setVs(self.vs)            
            
            
    def tearDown(self):
        
        #do cleanup first, probably relies on self.client
        self.doCleanups()
        
        del(self.vs)
        del(self.client)
        del(self.config)
        
