from __future__ import absolute_import

import unittest

from .utils import VidiunBaseTest

from VidiunClient.Plugins.ContentDistribution import (
    VidiunDistributionProfile,
    VidiunDistributionProfileListResponse,
    VidiunDistributionProvider,
    VidiunDistributionProviderListResponse,
    VidiunEntryDistribution,
    VidiunEntryDistributionListResponse,
    )


class DistributionProviderTests(VidiunBaseTest):

    def test_list(self):
        resp = self.client.contentDistribution.distributionProvider.list()
        self.assertIsInstance(resp, VidiunDistributionProviderListResponse)

        objs = resp.objects
        self.assertIsInstance(objs, list)

        [self.assertIsInstance(o, VidiunDistributionProvider) for o in objs]


class DistributionProfileTests(VidiunBaseTest):

    def test_list(self):
        resp = self.client.contentDistribution.distributionProfile.list()
        self.assertIsInstance(resp, VidiunDistributionProfileListResponse)

        objs = resp.objects
        self.assertIsInstance(objs, list)

        [self.assertIsInstance(o, VidiunDistributionProfile) for o in objs]


class EntryDistributionTests(VidiunBaseTest):

    def test_list(self):
        resp = self.client.contentDistribution.entryDistribution.list()
        self.assertIsInstance(resp, VidiunEntryDistributionListResponse)

        objs = resp.objects
        self.assertIsInstance(objs, list)

        [self.assertIsInstance(o, VidiunEntryDistribution) for o in objs]


def test_suite():
    return unittest.TestSuite((
        unittest.makeSuite(DistributionProviderTests),
        unittest.makeSuite(DistributionProfileTests),
        unittest.makeSuite(EntryDistributionTests),
        ))


if __name__ == "__main__":
    suite = test_suite()
    unittest.TextTestRunner(verbosity=2).run(suite)
