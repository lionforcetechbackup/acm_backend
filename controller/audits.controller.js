const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const { where } = require("sequelize");
exports.create = async (req) => {
  // console.log(req,1)
  try {
    db.audits
      .create({
        user_id: req.user_id,
        table_name: req.table_name,
        primary_id: req.primary_id,
        event: req.event,
        old_value: req.old_value,
        new_value: JSON.stringify(req.new_value),
        url: req.url,
        ip_address: req.ip_address,
        user_agent: req.user_agent,
        log_in: req.log_in,
        log_out: req.log_out,
      })
      .then((data) => {
        return data;
      })
      .catch((error) => {
        logger.info("/error", error);
        return error;
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};
exports.update = async (req, res) => {
  try {
    db.audits
      .update(
        {
          user_id: req.body.user_id,
          table_name: req.body.table_name,
          primary_id: req.body.primary_id,
          event: req.body.event,
          old_value: req.body.old_value,
          new_value: req.body.new_value,
          url: req.body.url,
          ip_address: req.body.ip_address,
          user_agent: req.body.user_agent,
          log_in: req.body.log_in,
          log_out: req.body.log_out,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then(() => res.send("success"))
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};
exports.get = async (req, res) => {
  try {
    db.audits
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
        },
      })
      .then((data) => res.send(data))
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.getById = async (req, res) => {
  try {
    db.audits
      .findAll({
        where: {
          id: req.params.id,
        },
      })
      .then((data) => res.send(data))
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};
exports.delete = async (req, res) => {
  //db.audits.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.audits
      .update(
        {
          status: master.status.delete,
        },
        {
          where: { id: req.params.id },
        }
      )
      .then((data) => {
        res.send("deleted");
      })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};
exports.statusChange = async (req, res) => {
  try {
    db.audits
      .update(
        {
          status: req.params.status,
        },
        {
          where: { id: req.params.id },
        }
      )
      .then((data) => res.send("status changed"))
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};
exports.dashboardLicence = async (req, res) => {
  //console.log(req.query.organization_type)
  //  var whereCondition='';
  let where = { status: { [Op.notIn]: [master.status.delete] } };
  if (req.query.organization_type) {
    where.organization_type = req.query.organization_type;
  }
  //console.log(where)
  db.organizations
    .findAll({
      where,
      // where: {
      //   status: { [Op.notIn]: [master.status.delete] }
      // },
      // attributes: [ 'organizations.*','subscriptionPackage.name'],

      include: [
        {
          model: db.subscription_packages,
          as: "subscriptionPackage",
          // attributes: ['name','id'],
          // nested: false,
          // required: true
        },
      ],
      raw: true,
    })
    .then((data) => {
      //  console.log(data);
      if (data.length > 0) {
        var finaldatas = [];
        for (let index = 0; index < data.length; index++) {
          const element = data[index];
          var str = element.valid_to;
          var split = str.split("----").pop();
          let date = formatDate(Date.now());
          let after15Days = formatDate(addDays(new Date(), 15));

          // var str="1619009278614----2021-04-21"
          // console.log(split,date,after15Days,split>=date,split<=after15Days)
          element.valid_to_format = split;
          if (element.status == 0) {
            element.sub_status = "pending";
            finaldatas.push(element);
          } else if (split >= date && split <= after15Days) {
            element.sub_status = "upcoming";
            finaldatas.push(element);
          } else {
            element.sub_status = "active";
            finaldatas.push(element);
          }
          if (data.length == index + 1) {
            res.send(finaldatas);
          }
          // console.log(finaldatas)
        }
      } else {
        res.send(data);
      }

      //  console.log(a.replace('----', ''))
      // console.log(str.substring(str.indexOf("----") + 4))
      // console.log(str.split("----").pop())
      //  let date=Date.now("1619009278614----2021-04-21")
      // let date=formatDate(Date.now())
      // console.log(split,date,split>date)
      // // console.log(formatDate(Date.now()))
      //  res.send({date:date});
    });
};
function addDays(theDate, days) {
  return new Date(theDate.getTime() + days * 24 * 60 * 60 * 1000);
}
function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}
