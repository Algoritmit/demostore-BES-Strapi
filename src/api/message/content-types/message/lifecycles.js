const webpush = require("web-push");

const sendPUSH = async ({ message, pushAddress, customer }) => {
  webpush.setVapidDetails(
    "mailto:mirage.phone@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  let payload = {
    title: message.title,
    text: `${message.text}`,
    link: getLink(message),
  };

  webpush
    .sendNotification(pushAddress, JSON.stringify(payload))
    .then(function () {
      console.log(`notification was sent to member "${customer.id}"`);
    })
    .catch(function (error) {
      console.log("Send notification error:", error);
    });
};

const sendEMail = async ({ message, customer }) => {};

const sendTelegram = async ({ message, customer }) => {};

const getLink = (message) => {
  const refGroup = message.refGroup?.connect;
  const refArticle = message.refArticle?.connect;
  const refProduct = message.refProduct?.connect;

  if (refProduct && refProduct.length > 0) return `/p/${refProduct[0].id}`;

  if (refArticle && refArticle.length > 0) return `/a/${refProduct[0].id}`;

  if (refGroup && refGroup.length > 0) return `/g/${refProduct[0].id}`;

  return `/`;
};

const sendingMessage = async ({ message, customers }) => {
  customers.forEach((customer) => {
    sendPUSH({ message, pushAddress: customer.pushAddress, customer });

    if (customer.email) {
      //&& customer.pushToEmail
      //Copy Push to eMail
      sendEMail({ message, customer });
    }
  });
};

const sendBroadcast = async ({ message }) => {
  //console.log("sendBroadcast() ", message);
  const allCustomers = await strapi.entityService.findMany(
    "api::customer.customer",
    {
      filters: {
        publishedAt: {
          $null: false,
        },
        pushAddress: {
          $null: false,
        },
      },
      populate: "*",
    }
  );

  sendingMessage({ message, customers: allCustomers });
};

const sendToCustomers = async ({ message, customers: toCustomers }) => {
  //console.log("sendToCustomers() toCustomers", message, toCustomers);
  const customers = await strapi.entityService.findMany(
    "api::customer.customer",
    {
      filters: {
        publishedAt: {
          $null: false,
        },
        pushAddress: {
          $null: false,
        },
        id: {
          $in: toCustomers.map((c) => c.id),
        },
      },
      populate: "*",
    }
  );
  //console.log("sendToCustomers() customers", customers);
  sendingMessage({ message, customers });
};

const sendToGroup = async ({ message, groups: toGroups }) => {
  //console.log("sendToGroup()", message, toGroups);
  const groups = await strapi.entityService.findMany(
    "api::notification-group.notification-group",
    {
      filters: {
        publishedAt: {
          $null: false,
        },
        pushAddress: {
          $null: false,
        },
        id: {
          $in: toGroups.map((c) => c.id),
        },
      },
      populate: "*",
    }
  );

  groups.forEach((g) => {
    sendingMessage({ message, customers: g.customers });
  });
};

module.exports = {
  async afterCreate(event) {
    const { result, params } = event;
    console.log("message.afterCreate() params", params);

    const toCustomers = event.params.data.toCustomers?.connect;
    const fromCustomer = event.params.data.fromCustomer?.connect;

    const broadcast = event.params.data.broadcast;
    const toGroup = event.params.data.toGroup?.connect;
    const text = event.params.data.text;
    const title = event.params.data.title;
    console.log("message.afterCreate() toCustomers", toCustomers);
    console.log("message.afterCreate() toGroup", toGroup);
    console.log("message.afterCreate() broadcast", broadcast);

    broadcast && sendBroadcast({ message: event.params.data });
    toCustomers &&
      toCustomers.length > 0 &&
      sendToCustomers({ message: event.params.data, customers: toCustomers });
    toGroup &&
      toGroup.length > 0 &&
      sendToGroup({ message: event.params.data, groups: toGroup });
  },

  afterUpdate(event) {
    const { result, params } = event;
    // console.log('message.afterUpdate() result', result);
    // console.log('message.afterUpdate() params', params);
    // do something to the result;
  },
};
