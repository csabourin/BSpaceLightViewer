const express = require("express");
const router = express.Router();
const {flattenItems} = require("../utils.js");

router.use("/common/dialogs/quickLink/quickLink.d2l", function(req, res) { 
 // Process Brightspace internal links
  const resourceCode = req.query.rcode;
  let href = null;

  for (let key in req.session.manifests) {
    let manifest = req.session.manifests[key];
    let foundHref = getHrefByResourceCode(flattenItems(manifest), resourceCode);
    if (foundHref) {
      href = foundHref;
      break;
    }
  }

  function getHrefByResourceCode(array, resourceCode) {
    for (let i = 0; i < array.length; i++) {
      if (array[i].resourceCode === resourceCode) {
        return array[i].href;
      }
    }
    return null;
  }

  if (!href) {
    let originalUrl = req.headers.referer || "/";
    res.render("messagePage", { currentpage: originalUrl });
    return;
  }

  // Return the href
  res.redirect(`/page/${href}`);
});

module.exports = router;
