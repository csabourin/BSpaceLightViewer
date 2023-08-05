const express = require("express");
const router = express.Router();
const {flattenItems} = require("../utils.js");

function findIdentifierByResourceCode(manifest, resourceCode) {
  // traverse each item in manifest
  for(let item of manifest) {
    if (item.resourceCode === resourceCode) {
      return item.identifier;
    }
    // search in the child items if any
    if (Array.isArray(item.items) && item.items.length) {
      let foundIdentifier = findIdentifierByResourceCode(item.items, resourceCode);
      if (foundIdentifier) {
        return foundIdentifier;
      }
    }
  }
  // if nothing found return null
  return null;
}

function getHrefByResourceCode(array, resourceCode) {
  for (let i = 0; i < array.length; i++) {

    if (array[i].resourceCode === resourceCode) {
      return {
        type: array[i].type,
        href: array[i].href,
        title: array[i].title,
        description: array[i].description,
      };
    }
  }
  return null;
}

router.use("/common/dialogs/quickLink/quickLink.d2l", function(req, res) { 
  let manifest = null;
  const resourceCode = req.query.rcode;
  let result = null;
  let file = null;

  for (let key in req.session.manifests) {
    manifest = req.session.manifests[key];
    let foundResult = getHrefByResourceCode(flattenItems(manifest), resourceCode);
    if (foundResult) {
      result = foundResult;
      file= key;
      break;
    }
  }

  if (!result) {
    let originalUrl = req.headers.referer || "/";
    res.render("messagePage", { currentpage: originalUrl });
    return;
  }

if (result.type === 'contentmodule') {
  let identifier = findIdentifierByResourceCode(flattenItems(manifest), resourceCode);
  const redirectUrl = `/resource/${file}/${identifier}`;
  res.send(`
    <html>
      <body>
        <script>
          window.parent.postMessage({
            type: 'changeUrl',
            url: '${redirectUrl}'
          }, '*'); // Adjust the targetOrigin argument as needed for security
        </script>
      </body>
    </html>
  `);
} else {
  res.redirect(`/page/${file}/${result.href}`);
  // res.redirect(`/page/${file}/${result.href}`);
}
});

module.exports = router;