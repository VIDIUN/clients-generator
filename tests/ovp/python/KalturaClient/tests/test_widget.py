from __future__ import absolute_import

import unittest

from .utils import VidiunBaseTest

from VidiunClient.Plugins.Core import VidiunWidgetListResponse


class WidgetTests(VidiunBaseTest):

    def test_list_widgets(self):
        widgets = self.client.widget.list()
        self.assertIsInstance(widgets, VidiunWidgetListResponse)


def test_suite():
    return unittest.TestSuite((
        unittest.makeSuite(WidgetTests),
        ))


if __name__ == "__main__":
    suite = test_suite()
    unittest.TextTestRunner(verbosity=2).run(suite)
