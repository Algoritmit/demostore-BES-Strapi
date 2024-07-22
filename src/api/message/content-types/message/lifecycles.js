const webpush = require("web-push");

const sendPUSH = async (message, pushAddress) => {
  webpush.setVapidDetails(
    "mailto:mirage.phone@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  let payload = {
    title: message.title,
    text: `${message.text}`,
    link: "/",
  };

  webpush
    .sendNotification(pushAddress, JSON.stringify(payload))
    .then(function () {
      console.log(`notification was sent to member "${message.text}"`);
    })
    .catch(function (error) {
      console.log("Send notification error:", error);
    });
};

module.exports = {
  async afterCreate(event) {
    const { result, params } = event;
    //console.log('message.afterCreate() result', result);
    console.log("message.afterCreate() params", params);

    const toCustomer = event.params.data.toCustomer?.connect || [];
    const fromCustomer = event.params.data.fromCustomer?.connect || {};
    const refGroup = event.params.data.refGroup?.connect;
    const refArticle = event.params.data.refArticle?.connect;
    const refProduct = event.params.data.refProduct?.connect;
    const broadcast = event.params.data.broadcast;
    const notification_group = event.params.data.notification_group?.connect;
    const text = event.params.data.text;
    const title = event.params.data.title;

    console.log("fromCustomer", fromCustomer);
    console.log("refArticle", refArticle);
    console.log("notification_group", notification_group);
    console.log("broadcast", broadcast);

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

    allCustomers.forEach((c)=>{
      sendPUSH(event.params.data,c.pushAddress)
    })

    console.log("allCustomers", allCustomers);
  },

  afterUpdate(event) {
    const { result, params } = event;
    // console.log('message.afterUpdate() result', result);
    // console.log('message.afterUpdate() params', params);
    // do something to the result;
  },
};
