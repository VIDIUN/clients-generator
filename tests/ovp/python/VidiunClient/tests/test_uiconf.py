from __future__ import absolute_import

import re
import unittest

from .utils import VidiunBaseTest

from VidiunClient.Plugins.Core import (
    VidiunUiConf,
    VidiunUiConfFilter,
    VidiunUiConfListResponse,
    VidiunUiConfObjType,
)


class UiConfTests(VidiunBaseTest):

    def test_list(self):
        resp = self.client.uiConf.list()
        self.assertIsInstance(resp, VidiunUiConfListResponse)

        objs = resp.objects
        self.assertIsInstance(objs, list)

        for o in objs:
            self.assertIsInstance(o, VidiunUiConf)

    def test_get_players(self):
        filt = VidiunUiConfFilter()

        players = [
                   VidiunUiConfObjType.PLAYER_V3,
                   VidiunUiConfObjType.PLAYER,
                   VidiunUiConfObjType.PLAYER_SL,
                  ]
        filt.setObjTypeIn(players)

        resp = self.client.uiConf.list(filter=filt)
        objs = resp.objects

        for o in objs:
            self.assertIn(o.objType.getValue(), players)

    '''def test_get_playlist_players(self):
        """Until I find a better way... this gets all uiconfs that are
           'playlist players'
           not sure if this is the right way"""
        filt = VidiunUiConfFilter()
        players = [
                   VidiunUiConfObjType.PLAYER_V3,
                   VidiunUiConfObjType.PLAYER,
                   VidiunUiConfObjType.PLAYER_SL,
                  ]
        tags = 'playlist'

        filt.setObjTypeIn(players)
        filt.setTagsMultiLikeOr(tags)

        resp = self.client.uiConf.list(filter=filt)
        objs = resp.objects

        for o in objs:
            self.assertIn(o.objType.getValue(), players)
            match = re.search('isPlaylist="(.*?)"', o.getConfFile())
            self.assertIsNotNone(match, "isPlaylist not found in confFile")

            value = match.group(1)
            self.assertIn(value, ["true", "multi"])'''

    def test_get_video_players(self):
        """Until I find a better way... this gets all uiconfs that are
           'single video' players
           Not sure if this is the right way"""
        filt = VidiunUiConfFilter()
        players = [VidiunUiConfObjType.PLAYER_V3,
                   VidiunUiConfObjType.PLAYER,
                   VidiunUiConfObjType.PLAYER_SL,
                  ]
        tags = 'player'

        filt.setObjTypeIn(players)
        filt.setTagsMultiLikeOr(tags)

        resp = self.client.uiConf.list(filter=filt)
        objs = resp.objects

        for o in objs:
            self.assertIn(o.objType.getValue(), players)
            match = re.search('isPlaylist="(.*?)"', o.getConfFile())
            if match is None:
                pass
            else:
                value = match.group(1)
                self.assertIn(value, ["true", "multi"])

    def test_list_templates(self):
        templates = self.client.uiConf.listTemplates()
        self.assertIsInstance(templates, VidiunUiConfListResponse)

        objs = templates.objects
        self.assertIsInstance(objs, list)

        for o in objs:
            self.assertIsInstance(o, VidiunUiConf)


def test_suite():
    return unittest.TestSuite((
        unittest.makeSuite(UiConfTests),
        ))


if __name__ == "__main__":
    suite = test_suite()
    unittest.TextTestRunner(verbosity=2).run(suite)
