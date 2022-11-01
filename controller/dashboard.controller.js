const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const { where } = require("sequelize");
const { getUpdatorScore } = require("../util/helper");
const helper = require("../util/helper");
exports.dashboardLicence = async (req, res) => {
  //console.log(req.query.organization_type)
  //  var whereCondition='';
  let where = {
    status: { [Op.notIn]: [master.status.delete] },
    id: { [Op.ne]: 67 },
  };
  if (req.query.organization_type) {
    where.organization_type = req.query.organization_type;
  }
  db.organizations
    .findAll({
      where,
      order: [["id", "DESC"]],
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
      // raw: true
    })
    .then((data) => {
      console.log(data.length);
      if (data.length > 0) {
        var finaldatas = [];
        for (let index = 0; index < data.length; index++) {
          const element = data[index];
          var str = element.valid_to;
          if (!str) {
            str = "0000-00-00";
          }
          var split = str.split("----").pop();
          let date = formatDate(Date.now());
          let after15Days = formatDate(addDays(new Date(), 15));

          // var str="1619009278614----2021-04-21"
          // console.log(split,date,after15Days,split>=date,split<=after15Days)
          element.dataValues.valid_to_format = split;
          if (element.dataValues.status == 0) {
            element.dataValues.sub_status = "pending";
            finaldatas.push(element);
          } else if (split <= date && split <= after15Days) {
            element.dataValues.sub_status = "upcoming";
            finaldatas.push(element);
          } else {
            element.dataValues.sub_status = "active";
            finaldatas.push(element);
          }
          //console.log(element.dataValues, 111111111111111)
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
exports.subscriberCount = async (req, res) => {
  var subscriberdetail = await db.organizations.findAll({
    where: {
      status: { [Op.notIn]: [master.status.delete] },
      id: { [Op.ne]: 67 },
    },
    include: [
      { model: db.subscription_packages, as: "subscriptionPackage" },
      { model: db.organization_type, as: "organizationtype" },
      // {model:db.company_libraries,as:'libraryForeign'}
    ],
  });
  var organizationType = await db.organization_type.findAll({
    where: {
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  //console.log(organizationType)
  if (organizationType.length > 0) {
    for (let index = 0; index < organizationType.length; index++) {
      const element = organizationType[index];
      var arraycount = [];
      //console.log(element.dataValues.id)

      for (let index1 = 0; index1 < subscriberdetail.length; index1++) {
        const element1 = subscriberdetail[index1].dataValues;
        if (element1.organization_type == element.id) {
          arraycount.push(element1);
        }
      }
      organizationType[index].dataValues.count = arraycount.length;
    }
  }
  //  console.log(subscriberdetail);
  res.send({
    organizationType: organizationType,
    subscriberdetailCount: subscriberdetail.length,
  });
};

exports.complienceRatePerSubscriber = async (req, res) => {
  var where = ` `;
  if (req.query.organization_type) {
    where = where + ` and organization_type=${req.query.organization_type}`;
  }

  const library_id = req.query.library_id;
  let sql = ` select B.id,B.name from  organization_libraries as A left join organizations as B on A.organization_id = B.id 
  where A.library_id=${library_id} && A.status=1 && B.status=1 ${where}  group by organization_id`;

  //console.log(sql);
  const organizations = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  let idx = 0;
  for (const organization of organizations) {
    let updatorLibraryScore =
      await helper.getLibraryScoreUpdatorSurveyorCompSuperAdmin(
        req,
        library_id,
        null,
        0,
        organization.id,
        req.query.fromdate,
        req.query.todate
      );

    console.log(updatorLibraryScore);
    if (isNaN(updatorLibraryScore)) {
      updatorLibraryScore = null;
    }
    organizations[idx].compliencescore = updatorLibraryScore;
    idx++;
  }

  res.send(organizations);

  /*
  db.sequelize
    .query(
      `select id,name,
      (select count(*) from sub_standards as A left join standards as B on A.standard_id=B.id
      left join chapters as C on B.chapter_id=C.id where C.library_id  in(select library_id from organization_libraries where organization_id=organizations.id group by library_id)) as totalSubstandatrd, 
      (select count(*) from score_mapping where library_id in (select library_id from organization_libraries where organization_id=organizations.id group by library_id)) as totalscoremappingstandard
      from organizations  where organizations.parent_id is null and ${where}`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    )
    .then((organizationsscore) => {
      if (organizationsscore.length > 0) {
        organizationsscore.forEach((element, idx) => {
          score = 0;
          if (element.totalscoremappingstandard > 0) {
            score =
              (element.totalscoremappingstandard / element.totalSubstandatrd) *
              100;
          }
          organizationsscore[idx].compliencescore = score.toFixed(2);
          if (organizationsscore.length == idx + 1) {
            res.send(organizationsscore);
          }
        });
      } else {
        res.send(organizationsscore);
      }
    })
    .catch((error) => {
      logger.info("/error", error);
      res.send(error);
    }); */
};

exports.complienceEachChapter = (req, res) => {
  let filterType = req.body.filterType;
  let library_id = req.body.library_id;
  let org_type = req.body.organization_type;
  let organization_id = req.body.organization_id;
  let where = "";
  if (req.body.fromDate && req.body.fromDate !== null) {
    where = where + ` AND createdAt>=${req.body.fromDate}`;
  }
  if (req.body.toDate && req.body.toDate !== null) {
    where = where + ` AND createdAt<=${req.body.toDate}`;
  }

  if (req.body.org_type && req.body.org_type !== null) {
    where =
      where +
      ` AND organization_id in (select id from organizations where organization_type=${org_type}  and parent_id is null) `;
  }

  // console.log(filterType);

  if (filterType == "sub_standard") {
    let sql = `select sub_standards.id,sub_standards.name,
    (select count(*) from  sub_standards as A left join standards as B on A.standard_id=B.id where A.id=sub_standards.id) as totalcount,
     (select count(*) from score_mapping where substanard_id=sub_standards.id && updator_score is not null ${where}) as complienceMet,
      (select count(*) from score_mapping where substanard_id=sub_standards.id && updator_score is  null ${where}) as complienNa
    from sub_standards left join standards on sub_standards.standard_id=standards.id 
    left join chapters on standards.chapter_id=chapters.id where library_id='${library_id}'`;
    db.sequelize
      .query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then(async (data) => {
        if (data.length > 0) {
          let scidx = 0;
          for (const element of data) {
            let updatorSubstandardScore =
              await helper.getSubstandardScoreUpdatorSurv(
                req,
                library_id,
                null,
                0,
                null,
                null,
                null,
                element.id,
                organization_id,
                req.body.fromDate,
                req.body.toDate
              );

            //   console.log(updatorChapterScore);
            data[scidx].compliencescore = updatorSubstandardScore;
            if (data.length == scidx + 1) {
              res.send(data);
            }
            scidx++;
          }
        } else {
          res.send(data);
        }
      })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } else if (filterType == "standard") {
    let sql = `select standards.id,standards.name,
    (select count(*) from  sub_standards as A left join standards as B on A.standard_id=B.id where B.id=standards.id) as totalcount,
    (select count(*) from score_mapping where standard_id=standards.id && updator_score is not null ${where}) as complienceMet,
    (select count(*) from score_mapping where standard_id=standards.id && updator_score is  null ${where}) as complienNa
    from standards left join chapters  on standards.chapter_id=chapters.id where library_id='${library_id}'`;

    //console.log(sql);

    db.sequelize
      .query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then(async (data) => {
        if (data.length > 0) {
          /*  data.forEach((element, idx) => {
            score = 0;
            if (element.complienceMet > 0) {
              score =
                (element.complienceMet /
                  (element.totalcount - element.complienNa)) *
                100;
            }
            data[idx].compliencescore = score.toFixed(2);
            if (data.length == idx + 1) {
              res.send(data);
            }
          }); */

          let scidx = 0;
          for (const element of data) {
            let updatorStandardScore = await helper.getStandardScoreUpdatorSurv(
              req,
              library_id,
              null,
              0,
              null,
              null,
              element.id,
              null,
              organization_id,
              req.body.fromDate,
              req.body.toDate
            );

            //   console.log(updatorChapterScore);
            data[scidx].compliencescore = updatorStandardScore;
            if (data.length == scidx + 1) {
              res.send(data);
            }
            scidx++;
          }
        } else {
          console.log(error);
          res.send(data);
        }
      })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } else {
    let updator_id = null;
    let sql = `select id,name,
  (select count(*) from  sub_standards as A left join standards as B on A.standard_id=B.id where B.chapter_id=chapters.id) as totalcount,
  (select count(*) from score_mapping where chapter_id=chapters.id && updator_score is not null ${where}) as complienceMet,
  (select count(*) from score_mapping where chapter_id=chapters.id && updator_score is  null ${where}) as complienNa
  from chapters where library_id='${library_id}'`;

    db.sequelize
      .query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then(async (data) => {
        if (data.length > 0) {
          /* data.forEach((element, idx) => {
            score = 0;
            if (element.complienceMet > 0) {
              score =
                (element.complienceMet /
                  (element.totalcount - element.complienNa)) *
                100;
            }
            data[idx].compliencescore = score.toFixed(2);
            if (data.length == idx + 1) {
              res.send(data);
            }
          }); */
          let scidx = 0;
          for (const element of data) {
            let updatorChapterScore = await helper.getChapterScoreUpdatorSurv(
              req,
              library_id,
              updator_id,
              0,
              null,
              element.id,
              null,
              null,
              organization_id,
              req.body.fromDate,
              req.body.toDate
            );

            //  console.log(element.id, " ", updatorChapterScore);

            //   console.log(updatorChapterScore);
            data[scidx].compliencescore = updatorChapterScore;
            if (data.length == scidx + 1) {
              res.send(data);
            }
            scidx++;
          }
        } else {
          res.send(data);
        }
      })
      .catch((error) => {
        console.log(error);
        logger.info("/error", error);
        res.send(error);
      });
  }
};

exports.ComplianceChart1 = (req, res) => {
  let where = { status: master.status.active };
  if (req.query.organization_type) {
    where.organization_type = req.query.organization_type;
  }
  db.organizations
    .findAll({
      where,

      include: [
        {
          model: db.organization_libraries,
          as: "library",
        },
      ],
    })
    .then(async (data) => {
      if (data.length > 0) {
        for (let key = 0; key < data.length; key++) {
          const element = data[key];
          data[key].dataValues.score = 0;
          if (data.length == key + 1) {
            res.send(data);
          }
        }
      } else {
        res.send(data);
      }
    })
    .catch((error) => {
      logger.info("/error", error);
      res.send(error);
    });
};
exports.ComplianceChart2 = (req, res) => {
  let where = { status: { [Op.notIn]: [master.status.delete] } };
  if (req.query.organization_type) {
    where.organization_type = req.query.organization_type;
  }
  if (req.query.type == "chapter") {
    if (req.query.organization_id && req.query.organization_id !== "") {
      db.sequelize
        .query(
          `select chap.name as name, chap.id as id, chap.createdAt as createdAt, chap.updatedAt as updatedAt, lib.id as libraryId, lib.name as libraryName, org.organization_id as orgId , orgn.organization_type as orgType from chapters chap, libraries lib , organization_libraries org, organizations orgn where chap.library_id=lib.id and lib.id=org.library_id and org.organization_id=${req.query.organization_id}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          if (data.length > 0) {
            for (let key = 0; key < data.length; key++) {
              const element = data[key];
              data[key].score = Math.random().toFixed(2) * 100;
              if (data.length == key + 1) {
                res.send(data);
              }
            }
          } else {
            res.send(data);
          }
        })
        .catch((error) => {
          res.send(error);
        });
    } else if (
      req.query.organization_type &&
      req.query.organization_type != ""
    ) {
      db.sequelize
        .query(
          `select chap.name as name, chap.id as id, chap.createdAt as createdAt, chap.updatedAt as updatedAt,lib.id as libraryId, lib.name as libraryName, org.organization_id as orgId , orgn.organization_type as orgType from chapters chap, libraries lib , organization_libraries org, organizations orgn where chap.library_id=lib.id and lib.id=org.library_id and org.organization_id=orgn.id  and orgn.organization_type=${req.query.organization_type}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          if (data.length > 0) {
            for (let key = 0; key < data.length; key++) {
              const element = data[key];
              data[key].score = Math.random().toFixed(2) * 100;
              if (data.length == key + 1) {
                res.send(data);
              }
            }
          } else {
            res.send(data);
          }
        })
        .catch((error) => {
          res.send(error);
        });
    } else {
      db.sequelize
        .query(
          `select distinct chap.name as name, chap.id as id,chap.createdAt as createdAt, chap.updatedAt as updatedAt, lib.id as libraryId, lib.name as libraryName from chapters chap, libraries lib , organization_libraries org, organizations orgn where chap.library_id=lib.id and lib.id=org.library_id and org.organization_id=orgn.id`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          if (data.length > 0) {
            for (let key = 0; key < data.length; key++) {
              const element = data[key];
              data[key].score = Math.random().toFixed(2) * 100;
              if (data.length == key + 1) {
                res.send(data);
              }
            }
          } else {
            res.send(data);
          }
        })
        .catch((error) => {
          console.log(error);
          res.send(error);
        });
    }
  } else if (req.query.type == "standard") {
    if (req.query.organization_id && req.query.organization_id != "") {
      db.sequelize
        .query(
          `select std.name as name, std.id as id, std.createdAt as createdAt, std.updatedAt as updatedAt,lib.id as libraryId, lib.name as libraryName, org.organization_id as orgId , orgn.organization_type as orgType from  standards std, chapters chap, libraries lib , organization_libraries org, organizations orgn where std.chapter_id = chap.id and std.status=1 and chap.status=1 and lib.status=1 and chap.library_id=lib.id and lib.id=org.library_id and org.organization_id=${req.query.organization_id}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          if (data.length > 0) {
            for (let key = 0; key < data.length; key++) {
              const element = data[key];
              data[key].score = Math.random().toFixed(2) * 100;
              if (data.length == key + 1) {
                res.send(data);
              }
            }
          } else {
            res.send(data);
          }
        })
        .catch((error) => {
          res.send(error);
        });
    } else if (
      req.query.organization_type &&
      req.query.organization_type != ""
    ) {
      db.sequelize
        .query(
          `select std.name as name, std.id as id, std.createdAt as createdAt, std.updatedAt as updatedAt,lib.id as libraryId, lib.name as libraryName, org.organization_id as orgId , orgn.organization_type as orgType from  standards std, chapters chap, libraries lib , organization_libraries org, organizations orgn where std.chapter_id = chap.id and std.status=1 and chap.status=1 and lib.status=1 and chap.library_id=lib.id and lib.id=org.library_id and org.organization_id=orgn.id  and orgn.organization_type=${req.query.organization_type}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          if (data.length > 0) {
            for (let key = 0; key < data.length; key++) {
              const element = data[key];
              data[key].score = Math.random().toFixed(2) * 100;
              if (data.length == key + 1) {
                res.send(data);
              }
            }
          } else {
            res.send(data);
          }
        })
        .catch((error) => {
          res.send(error);
        });
    } else {
      db.sequelize
        .query(
          `select distinct std.name as name, std.id as id, std.createdAt as createdAt, std.updatedAt as updatedAt,lib.id as libraryId, lib.name as libraryName from  standards std, chapters chap, libraries lib , organization_libraries org, organizations orgn where std.chapter_id = chap.id and std.status=1 and chap.status=1 and lib.status=1 and chap.library_id=lib.id and lib.id=org.library_id and org.organization_id=orgn.id`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          if (data.length > 0) {
            for (let key = 0; key < data.length; key++) {
              const element = data[key];
              data[key].score = Math.random().toFixed(2) * 100;
              if (data.length == key + 1) {
                res.send(data);
              }
            }
          } else {
            res.send(data);
          }
        })
        .catch((error) => {
          res.send(error);
        });
    }
  } else if (req.query.type == "sub_standard") {
    if (req.query.organization_id && req.query.organization_id != "") {
      db.sequelize
        .query(
          `select sub.name as name, sub.id as id, sub.createdAt as createdAt, sub.updatedAt as updatedAt,lib.id as libraryId, lib.name as libraryName, org.organization_id as orgId , orgn.organization_type as orgType from sub_standards sub, standards std, chapters chap, libraries lib , organization_libraries org, organizations orgn where sub.standard_id=std.id and sub.status=1 and std.chapter_id = chap.id and std.status=1 and chap.status=1 and lib.status=1 and chap.library_id=lib.id and lib.id=org.library_id and org.organization_id=${req.query.organization_id}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          if (data.length > 0) {
            for (let key = 0; key < data.length; key++) {
              const element = data[key];
              data[key].score = Math.random().toFixed(2) * 100;
              if (data.length == key + 1) {
                res.send(data);
              }
            }
          } else {
            res.send(data);
          }
        })
        .catch((error) => {
          res.send(error);
        });
    } else if (
      req.query.organization_type &&
      req.query.organization_type != ""
    ) {
      db.sequelize
        .query(
          `select sub.name as name, sub.id as id, sub.createdAt as createdAt, sub.updatedAt as updatedAt,lib.id as libraryId, lib.name as libraryName, org.organization_id as orgId , orgn.organization_type as orgType from sub_standards sub, standards std, chapters chap, libraries lib , organization_libraries org, organizations orgn where sub.standard_id=std.id and sub.status=1 and std.chapter_id = chap.id and std.status=1 and chap.status=1 and lib.status=1 and chap.library_id=lib.id and lib.id=org.library_id and org.organization_id=orgn.id and  orgn.organization_type=${req.query.organization_type}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          if (data.length > 0) {
            for (let key = 0; key < data.length; key++) {
              const element = data[key];
              data[key].score = Math.random().toFixed(2) * 100;
              if (data.length == key + 1) {
                res.send(data);
              }
            }
          } else {
            res.send(data);
          }
        })
        .catch((error) => {
          res.send(error);
        });
    } else {
      db.sequelize
        .query(
          `select distinct sub.name as name, sub.id as id,sub.createdAt as createdAt, sub.updatedAt as updatedAt, lib.id as libraryId, lib.name as libraryName from sub_standards sub, standards std, chapters chap, libraries lib , organization_libraries org, organizations orgn where sub.standard_id=std.id and sub.status=1 and std.chapter_id = chap.id and std.status=1 and chap.status=1 and lib.status=1 and chap.library_id=lib.id and lib.id=org.library_id  and org.organization_id=orgn.id`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          if (data.length > 0) {
            for (let key = 0; key < data.length; key++) {
              const element = data[key];
              data[key].score = Math.random().toFixed(2) * 100;
              if (data.length == key + 1) {
                res.send(data);
              }
            }
          } else {
            res.send(data);
          }
        })
        .catch((error) => {
          res.send(error);
        });
    }
  } else if (req.query.type == "library") {
    // db.libraries
    //   .findAll({
    //     where: {
    //       status: { [Op.notIn]: [master.status.delete] },
    //     },
    //   })
    let where = {};
    if (req.headers.organization) {
      where: {
        id: req.headers.organization;
      }
    }

    if (req.query.organization_type) {
      where.organization_type = req.query.organization_type;
    }
    db.organizations
      .findAll({
        where,
        include: [
          {
            model: db.organization_libraries,
            as: "library",
            include: [
              {
                model: db.libraries,
                as: "libraries",
                attributes: ["code", "name"],
                where: {
                  status: { [Op.notIn]: [master.status.delete] },
                },
                // nested: false,
                // required: true
              },
            ],
            raw: true,
          },
        ],
      })
      .then((data) => {
        if (data.length > 0) {
          for (let key = 0; key < data.length; key++) {
            const element = data[key];
            data[key].dataValues.score = Math.random().toFixed(2) * 100;
            if (data.length == key + 1) {
              res.send(data);
            }
          }
        } else {
          res.send(data);
        }
      });
  }
};
exports.userCount = async (req, res) => {
  let organization_id = req.organization_id;

  if (req.query.organization_id) {
    organization_id = +req.query.organization_id;
  }

  if (
    req.query.organization_id == undefined ||
    req.query.organization_id == "undefined"
  ) {
    organization_id = req.organization_id;
  }

  var where = {
    status: { [Op.notIn]: [master.status.delete] },
    [Op.or]: [
      {
        organization_id: organization_id,
      },
      {
        parent_organization_id: organization_id,
      },
    ],
  };

  db.users
    .findAll({
      where: where,
      logging: console.log,
    })
    .then((data) => {
      // res.send(data.length);
      if (data.length > 0) {
        var details = {};
        details.surveyor = 0;
        details.viewer = 0;
        details.updator = 0;
        details.clientadmin = 0;
        data.forEach((element, key) => {
          //console.log(data.length, details, element.role_id, master.role.viewer);

          //
          if (master.role.clientadmin == element.role_id) {
            //5
            details.clientadmin = details.clientadmin + 1;
          }

          if (master.role.superclientadmin == element.role_id) {
            //5
            details.clientadmin = details.clientadmin + 1;
          }
          if (master.role.surveyor == element.role_id) {
            //5
            details.surveyor = details.surveyor + 1;
          }
          if (master.role.viewer == element.role_id) {
            // 6
            details.viewer = details.viewer + 1;
          }
          if (master.role.updator == element.role_id) {
            //4
            details.updator = details.updator + 1;
          }
          if (key + 1 == data.length) {
            res.send(details);
          }
        });
      }
    })
    .catch((err) => res.send(err));
};
exports.expiredate = async (req, res) => {
  let where = {
    status: { [Op.notIn]: [master.status.delete] },
    id: req.get("organization") ,
  }; 

  db.organizations
    .findOne({
      where: where,
    })
    .then(async (data) => { 
      if (data) {
        if (data.parent_id != null) {
          //console.log("khhjb", data.parent_id);
          var datas = await expiredate(data.parent_id);
          res.send(datas);
        } else {
          //console.log("data");
          res.send(data);
        }
      } else {
        res.send(data);
      }
    })
    .catch((err) => res.send(err));
};
expiredate = async (id) => {
  return await db.organizations.findOne({ where: { id: id } });
};

exports.updatorScore = async (req, res) => {
  let organization_id = req.organization_id;

  if (req.query.organization_id && req.query.organization_id !== undefined) {
    organization_id = req.query.organization_id;
  }

  let where = {
    status: { [Op.notIn]: [master.status.delete] },
    // organization_id: req.headers["organization"],
    role_id: master.role.updator,
  };

  if (req.headers["organization"]) {
    where.organization_id = organization_id;
  }
  if (req.query.organization_id && req.query.organization_id !== undefined) {
    where.organization_id = req.query.organization_id;
  } else {
    where.organization_id = req.organization_id;
  }
  let users = await db.users.findAll({ where: where }).then((data) => {
    return data.map((data) => data.id);
  });

  let whereval = {
    updator_id: { [Op.in]: users },
    updator_score: { [Op.ne]: -1 },
  };
  if (req.query.organization_id && req.query.organization_id !== undefined) {
    whereval.organization_id = organization_id;
  } else {
    whereval.organization_id = req.organization_id;
  }

  //updatorscore = await getUpdatorScore(req, null, users[0]);

  let newUpdatorScores = await db.score_mapping.findAll({
    where: whereval,
    group: ["updator_id"],
    attributes: [
      "id",
      "organization_id",
      "updator_id",
      [
        db.sequelize.fn("SUM", db.score_mapping.sequelize.col("updator_score")),
        "updator_score_all",
      ],
      [
        db.sequelize.fn(
          "count",
          db.score_mapping.sequelize.col("updator_score")
        ),
        "count",
      ],
    ],
    include: [
      {
        model: db.users,
        as: "updatorJoin",
        attributes: ["name", "role_id", "organization_id", "email"],
        include: [
          { model: db.roles, as: "roles", attributes: ["role_name"] },
          {
            model: db.organizations,
            as: "organizationJoin",
            attributes: ["name"],
          },
        ],
      },
    ],
  });

  let idx = 0;
  let scoresArr = [];
  for (const updator of newUpdatorScores) {
    //console.log(organization_id);
    // console.log(updator.updator_id);
    // score = await getUpdatorScore(req, null, updator.updator_id);
    let score = await helper.getOverallLibraryScoreUpdatorById(
      req,
      updator.updator_id,
      0,
      organization_id
    );
    // console.log(score);
    scoresArr.push(score);
    // console.log('score....'+score);
    // if (newUpdatorScores[idx] && newUpdatorScores[idx].dataValues) {
    // // console.log('score....'+score);
    //   newUpdatorScores[idx].dataValues.score = score.toFixed() ;
    //   newUpdatorScores[idx].dataValues.updator_score_all = score.toFixed();
    // }  //all updator score not displaying 1st one undefined
    idx++;
  }
  //console.log('scores........',scoresArr);

  //console.log(scoresArr[idx]);

  let UpdatorScores = newUpdatorScores.map((el, idx) => {
    let newscoreupdator = scoresArr[idx];

    if (newscoreupdator) {
      newscoreupdator = newscoreupdator;
    } else {
      newscoreupdator = null;
    }

    return {
      ...el.dataValues,
      score: newscoreupdator,
      updator_score_all: newscoreupdator,
    };
  });
  res.send(UpdatorScores);
};
exports.checklistScore = async (req, res) => {
  let organization_id = req.organization_id;
  let library_id = null;
  let libCond = "";
  if (req.query.organization_id && req.query.organization_id != "") {
    organization_id = req.query.organization_id;
  }

  if (
    req.query.organization_id == undefined ||
    req.query.organization_id == "undefined"
  ) {
    organization_id = req.organization_id;
  }

  if (req.query.library_id) {
    library_id = req.query.library_id;
  }

  if (library_id && library_id != "undefined") {
    libCond = ` && library_id=${library_id} `;
  }

  var where = {
    status: { [Op.notIn]: [master.status.delete] },
    organization_id: organization_id,
  };

  if (req.query.organization_id) {
    where.organization_id = req.query.organization_id;
  }

  if (!library_id || library_id == "undefined") {
    return res.status(401).send("No Library Selected");
  }

  let adminActivityMapping = `select * from activity_mapping where organization_id in (0,${organization_id}) and library_id=${library_id} and status !=2 
  and admin_activity_id is not null group by admin_activity_id,client_activity_id`;
  let clientActivityMapping = `select * from activity_mapping where organization_id in (0,${organization_id}) and library_id=${library_id} and status !=2 
  and client_activity_id is not null group by client_activity_id,admin_activity_id`;

 

  let adminStorageChecklistScore = `select round(avg(sc),2) from (select avg(case when A.response="Yes" then 100 when A.response="No" then 0
          else null end) as sc from storage_activity_checklist_elements as A inner join storage_activity_checklist as B on A.storage_id=B.id  and B.organization_id=${organization_id} 
          and  B.admin_activity_id=m.admin_activity_id and element_id in (select A.id from activity_elements as A inner join (select A.*,B.substandard_uid from activity_mapping as A inner join sub_standards as B on A.substandard_id=B.id  && A.organization_id in (0,${req.organization_id} ) and A.library_id=${library_id} and A.status !=2 and A.admin_activity_id=m.admin_activity_id 
       group by substandard_id) as B on A.substandard_id=B.substandard_uid  where (A.organization_id is null or A.organization_id=${organization_id} )
       group by A.id) group by A.storage_id) as s
             `;

  let clientStorageChecklistScore = `select round(avg(sc),2) from (select avg(case when A.response="Yes" then 100 when A.response="No" then 0
             else null end) as sc from storage_activity_checklist_elements as A inner join storage_activity_checklist as B on A.storage_id=B.id  and B.organization_id=${organization_id} 
             and  B.client_activity_id=m.client_activity_id and ( element_id in  ( select A.id from activity_elements as A  inner join 
              (select A.*,B.substandard_uid from activity_mapping as A inner join sub_standards as B on A.substandard_id=B.id && A.organization_id in (${organization_id}) and A.library_id=${library_id} and A.status !=2 and A.client_activity_id=m.client_activity_id
               group by substandard_id) as B on A.substandard_id=B.substandard_uid  where (A.organization_id is null or A.organization_id=${organization_id} ) 
               group by A.id)    ||  element_id in (select id from activity_elements  where client_activity_id=m.client_activity_id && substandard_id is null)) group by A.storage_id) as s
                `;

  /*   (${adminStorageChecklistScore}) as score 
 (${clientStorageChecklistScore}) as score  
*/
  let sql = `select A.name as activity,A.code,m.client_activity_id,m.admin_activity_id
  from (${adminActivityMapping}) m
  left join admin_activities as A  on m.admin_activity_id=A.id  and A.type=1 
  left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${organization_id}  and p.library_id=${library_id}   && p.role_id=4
  where  A.type=1  group by A.id,m.library_id  order by A.id desc`;
  //(select ROUND(avg(score),2) from  storage_activity_checklist where client_activity_id=A.id && organization_id=${organization_id} ) as score
  let clientSql = `select A.name as activity,A.code,m.client_activity_id,m.admin_activity_id 
   from (${clientActivityMapping}) m
  left join client_admin_activities as A  on m.client_activity_id=A.id  and A.type=1 
  left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${organization_id}  and p.library_id=${library_id}  && p.role_id=4
  where  A.type=1  group by A.id,m.library_id  order by A.id desc 
`;


  let adminActivities = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  let clientActivities = await db.sequelize.query(clientSql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  if (clientActivities.length > 0) {
    adminActivities = adminActivities.concat(clientActivities);
  }

  
 

  let chIdx = 0;
  for (const element of adminActivities) {
    let sqlchk = `select round(avg(sc),2) as score from (select avg(case when A.response="Yes" then 100 when A.response="No" then 0
          else null end) as sc from storage_activity_checklist_elements as A inner join storage_activity_checklist as B on A.storage_id=B.id  and B.organization_id=${organization_id} 
          and  B.admin_activity_id='${element.admin_activity_id}' and (element_id in (select A.id from activity_elements as A inner join (select A.*,B.substandard_uid from activity_mapping as A inner join sub_standards as B on A.substandard_id=B.id  && A.organization_id in (0,${organization_id} ) and A.library_id=${library_id} and A.status !=2 and A.admin_activity_id='${element.admin_activity_id}' 
       group by substandard_id) as B on A.substandard_id=B.substandard_uid  where (A.organization_id is null or A.organization_id=${organization_id} )
       group by A.id)  ||  element_id in (select id from activity_elements  where admin_activity_id='${element.admin_activity_id}' && substandard_id is null) ) group by A.storage_id) as s
             `;

    if (element.client_activity_id) {
      sqlchk = `select round(avg(sc),2) as score from (select avg(case when A.response="Yes" then 100 when A.response="No" then 0
      else null end) as sc from storage_activity_checklist_elements as A inner join storage_activity_checklist as B on A.storage_id=B.id  and B.organization_id=${organization_id} 
      and  B.client_activity_id=${element.client_activity_id} and ( element_id in  ( select A.id from activity_elements as A  inner join 
       (select A.*,B.substandard_uid from activity_mapping as A inner join sub_standards as B on A.substandard_id=B.id && A.organization_id in (${organization_id}) and A.library_id=${library_id} and A.status !=2 and A.client_activity_id=${element.client_activity_id}
        group by substandard_id) as B on A.substandard_id=B.substandard_uid  where (A.organization_id is null or A.organization_id=${req.organization_id} ) 
        group by A.id)    ||  element_id in (select id from activity_elements  where client_activity_id=${element.client_activity_id} && substandard_id is null)) group by A.storage_id) as s`;
    }

  

    let chScore = await db.sequelize.query(sqlchk, {
      type: db.sequelize.QueryTypes.SELECT,
    });

 
      chScore = await helper.getChecklistScore(req,element.admin_activity_id,element.client_activity_id,organization_id,library_id);
   
    // console.log(await helper.getChecklistScore(req,element.admin_activity_id,element.client_activity_id,organization_id,library_id));
   
    adminActivities[chIdx].score = chScore > 0 ? chScore : null;
    chIdx++;
  }

  let allActivity = adminActivities
    .map((activity) => {
      let list = {};
      if (activity.admin_activity_id) {
        list = {
          ...activity,
          adminActivityDetail: {
            name: activity.activity,
            code: activity.code,
          },
          element: [{ response: +activity.score ? (+activity.score).toFixed(2) : activity.score }],
        };
      } else {
        list = {
          ...activity,
          clientActivityDetail: {
            name: activity.activity,
            code: activity.code,
          },
          element:  [{ response: +activity.score ? (+activity.score).toFixed(2) : activity.score }],
        };
      }

      return list;
    })
    .filter((el) => el.score);

    allActivity = allActivity.map(el=>({...el,score : +el.score ? (+el.score).toFixed(2) : el.score}))

  res.send(allActivity);
};

exports.complianceBranch = async (req, res) => {
  //params 1.library 2.role 3.fromdate 4.todate 5 role

  let organization = [];

  await db.organizations
    .findAll({
      where: {
        parent_id: req.body.parent_organization_id,
        status: {
          [Op.ne]: 2,
        },
      },
      include: [
        {
          model: db.organization_libraries,
          as: "library",
          include: [
            {
              model: db.libraries,
              as: "libraries",
              attributes: ["code", "name"],
              // nested: false,
              // required: true
            },
          ],
          raw: true,
        },
      ],
    })
    .then((data) => {
      organization = data;
    });

  var organization_parent = [];

  await db.organizations
    .findAll({
      where: {
        id: req.body.parent_organization_id,
        status: {
          [Op.ne]: 2,
        },
      },
      include: [
        {
          model: db.organization_libraries,
          as: "library",
          // attributes: ['library.*'],
          include: [
            {
              model: db.libraries,
              as: "libraries",
              attributes: ["code", "name"],
            },
          ],
        },
      ],
    })
    .then((result) => (organization_parent = result));

  var final = organization_parent.concat(organization);

  var where = {};
  if (req.body.from_date) {
    where.createdAt = {
      [Op.gte]: req.body.from_date,
    };
  }
  if (req.body.to_date) {
    where.createdAt = {
      [Op.lte]: req.query.to_date,
    };
  }

  let cond = "";

  if (req.body.fromDate && req.body.toDate) {
    cond =
      cond +
      ` and createdAt between '${req.body.fromDate}' and '${req.body.toDate}'  `;
  }

  if (req.body.library) {
    cond = cond + ` and library_id=${req.body.library}  `;
  }

  let idx = 0;
  for (const element of final) {
    final[idx].dataValues.score = 0;
    latestscore = 0;
    if (req.body.role == "Internalsurveyor") {
      if (req.body.library) {
        latestscore = await helper.getLibraryScoreByBranch(
          req,
          element.id,
          req.body.library,
          1
        );
        
      }
    } else if (req.body.role == "Externalsurveyor") {
      if (req.body.library) {
        latestscore = await helper.getLibraryScoreByBranch(
          req,
          element.id,
          req.body.library,
          2
        );
      }
    } else {
      // console.log("lib......", req.body.library);

      if (req.body.library) {
        latestscore = await helper.getLibraryScoreByBranch(
          req,
          element.id,
          req.body.library,
          0
        );
      } else {
        latestscore = 0;
      }

      // console.log(latestscore);
    }

    // console.log(latestscore);
    final[idx].dataValues.score = latestscore;


    idx++;
  }

  res.send(final);

};

exports.complianceMet = async (req, res) => {
  //console.log(req.body)
  var where = { organization_id: req.headers["organization"] };
  if (req.body.from_date) {
    where.createdAt = {
      [Op.gte]: req.body.from_date,
    };
  }
  if (req.body.to_date) {
    where.createdAt = {
      [Op.lte]: req.query.to_date,
    };
  }

  var score = await db.score_mapping
    .findOne({
      where: where,
      attributes: [
        "id",
        "organization_id",
        [
          db.sequelize.literal(
            `(select count(distinct library_id) from score_mapping )`
          ),
          "totalLibrary",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct library_id) from score_mapping where (updator_score  not in (null,-1) and updator_score !=0))`
          ),
          "totalLibraryMet",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct library_id) from score_mapping where updator_score =0)`
          ),
          "totalLibraryNotMet",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct library_id) from score_mapping where updator_score in (NULL,-1))`
          ),
          "totalLibraryNA",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct chapter_id) from score_mapping )`
          ),
          "totalChapter",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct chapter_id) from score_mapping where (updator_score  not in (null,-1) and updator_score !=0))`
          ),
          "totalChapterMet",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct chapter_id) from score_mapping where updator_score=0)`
          ),
          "totalChapterNotMet",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct chapter_id) from score_mapping where updator_score in (null,-1))`
          ),
          "totalChapterNA",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct standard_id) from score_mapping  )`
          ),
          "totalStandard",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct standard_id) from score_mapping where (updator_score  not in (null,-1) and updator_score !=0))`
          ),
          "totalStandardMet",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct standard_id) from score_mapping where updator_score=0)`
          ),
          "totalStandardNotMet",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct standard_id) from score_mapping where updator_score in (null,-1))`
          ),
          "totalStandardNA",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct substanard_id) from score_mapping )`
          ),
          "totalSubstandatd",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct substanard_id) from score_mapping where (updator_score  not in (null,-1) and updator_score !=0))`
          ),
          "totalSubstandatdMet",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct substanard_id) from score_mapping where updator_score=0)`
          ),
          "totalSubstandatdNotMet",
        ],
        [
          db.sequelize.literal(
            `(select count(distinct substanard_id) from score_mapping where updator_score in (null, -1))`
          ),
          "totalSubstandatdNA",
        ],
      ],

      // attributes: ['id', 'organization_id',
      //   [db.sequelize.fn('SUM', db.score_mapping.sequelize.col('updator_score')), 'updator_score_all'],
      //   [db.sequelize.fn('SUM', db.score_mapping.sequelize.col('internal_surveyor_score')), 'internal_surveyor_score_all'],
      //   [db.sequelize.fn('SUM', db.score_mapping.sequelize.col('external_surveyor_score')), 'external_surveyor_score_all'],
      //   [db.sequelize.fn('count', db.score_mapping.sequelize.col('updator_score')), 'count'],
      //   [db.sequelize.fn('count', db.score_mapping.sequelize.col('updator_score')), 'updatormet']
      // ],
      // group:['']
    })
    .then((data) => {
      if (data) {
        //console.log(data);
        //library
        data.dataValues.totalLibraryMetPer =
          data.dataValues.totalLibraryMet > 0
            ? (data.dataValues.totalLibraryMet / data.dataValues.totalLibrary) *
            100
            : 0;
        data.dataValues.totalLibraryNotMetPer =
          data.dataValues.totalLibraryNotMet > 0
            ? (data.dataValues.totalLibraryNotMet /
              data.dataValues.totalLibrary) *
            100
            : 0;
        data.dataValues.totalLibraryNAPer =
          data.dataValues.totalLibraryNA > 0
            ? (data.dataValues.totalLibraryNA / data.dataValues.totalLibrary) *
            100
            : 0;
        //chapter
        data.dataValues.totalChapterMetPer =
          data.dataValues.totalChapterMet > 0
            ? (data.dataValues.totalChapterMet / data.dataValues.totalChapter) *
            100
            : 0;
        data.dataValues.totalChapterNotMetPer =
          data.dataValues.totalChapterNotMet > 0
            ? (data.dataValues.totalChapterNotMet /
              data.dataValues.totalChapter) *
            100
            : 0;
        data.dataValues.totalChapterNAPer =
          data.dataValues.totalChapterNA > 0
            ? (data.dataValues.totalChapterNA / data.dataValues.totalChapter) *
            100
            : 0;

        data.dataValues.totalStandardMetPer =
          data.dataValues.totalStandardMet > 0
            ? (data.dataValues.totalStandardMet /
              data.dataValues.totalStandard) *
            100
            : 0;
        data.dataValues.totalStandardNotMetPer =
          data.dataValues.totalStandardNotMet > 0
            ? (data.dataValues.totalStandardNotMet /
              data.dataValues.totalStandard) *
            100
            : 0;
        data.dataValues.totalStandardNAPer =
          data.dataValues.totalStandardNA > 0
            ? (data.dataValues.totalStandardNA /
              data.dataValues.totalStandard) *
            100
            : 0;

        data.dataValues.totalSubstandatdMetPer =
          data.dataValues.totalSubstandatdMet > 0
            ? (data.dataValues.totalSubstandatdMet /
              data.dataValues.totalSubstandatd) *
            100
            : 0;
        data.dataValues.totalSubstandatdNotMetPer =
          data.dataValues.totalSubstandatdNotMet > 0
            ? (data.dataValues.totalSubstandatdNotMet /
              data.dataValues.totalSubstandatd) *
            100
            : 0;
        data.dataValues.totalSubstandatdNAPer =
          data.dataValues.totalSubstandatdNA > 0
            ? (data.dataValues.totalSubstandatdNA /
              data.dataValues.totalSubstandatd) *
            100
            : 0;
        return res.send(data);
      } else {
        data = {
          totalLibrary: 0,
          totalLibraryMet: 0,
          totalLibraryNotMet: 0,
          totalLibraryNA: 0,
          totalChapter: 0,
          totalChapterMet: 0,
          totalChapterNotMet: 0,
          totalChapterNA: 0,
          totalStandard: 0,
          totalStandardMet: 0,
          totalStandardNotMet: 0,
          totalStandardNA: 0,
          totalSubstandatd: 0,
          totalSubstandatdMet: 0,
          totalSubstandatdNotMet: 0,
          totalSubstandatdNA: 0,
        };
        return res.send(data);
      }

      // if(data.length>0){
      //   let complience= data.filter(function (e) { return (e.updator_score == 1)});
      // console.log(complience.length);
      // res.send(complience);
      // }
    });

  /*
  if (req.body.sort == "all") {
    await db.score_mapping
      .findAll({
        where: where,
        attributes: [
          "id",
          "organization_id",
          "library_id",
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("updator_score")
            ),
            "updator_score_all",
          ],
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("internal_surveyor_score")
            ),
            "internal_surveyor_score_all",
          ],
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("external_surveyor_score")
            ),
            "external_surveyor_score_all",
          ],
          [
            db.sequelize.fn(
              "count",
              db.score_mapping.sequelize.col("updator_score")
            ),
            "count",
          ],
          [
            db.sequelize.fn(
              "count",
              db.score_mapping.sequelize.col("updator_score")
            ),
            "updatormet",
          ],
        ],
        group: ["library_id"],
      })
      .then((data) => {
        res.send(data);
      });

    // var score = await db.score_mapping.findAll({
    //   where: where,
    //   // attributes: ['id', 'organization_id',
    //   //   [db.sequelize.fn('SUM', db.score_mapping.sequelize.col('updator_score')), 'updator_score_all'],
    //   //   [db.sequelize.fn('SUM', db.score_mapping.sequelize.col('internal_surveyor_score')), 'internal_surveyor_score_all'],
    //   //   [db.sequelize.fn('SUM', db.score_mapping.sequelize.col('external_surveyor_score')), 'external_surveyor_score_all'],
    //   //   [db.sequelize.fn('count', db.score_mapping.sequelize.col('updator_score')), 'count'],
    //   //   [db.sequelize.fn('count', db.score_mapping.sequelize.col('updator_score')), 'updatormet']
    //   // ],
    // // group:['']
    //   }).then((data)=>{
    //     if(data.length>0){
    //       let complience= data.filter(function (e) { return (e.updator_score == 1)});
    //     console.log(complience.length);

    //     res.send(complience);
    //     }
    //   })
    // final[key].dataValues.library[key1].dataValues.score = score;
  } else {
    var score = await db.score_mapping.findAll({
      where: where,
      attributes: [
        "id",
        "organization_id",
        [
          db.sequelize.fn(
            "SUM",
            db.score_mapping.sequelize.col("updator_score")
          ),
          "updator_score_all",
        ],
        [
          db.sequelize.fn(
            "SUM",
            db.score_mapping.sequelize.col("internal_surveyor_score")
          ),
          "internal_surveyor_score_all",
        ],
        [
          db.sequelize.fn(
            "SUM",
            db.score_mapping.sequelize.col("external_surveyor_score")
          ),
          "external_surveyor_score_all",
        ],
        [
          db.sequelize.fn(
            "count",
            db.score_mapping.sequelize.col("updator_score")
          ),
          "count",
        ],
      ],
    });
    final[key].dataValues.library[key1].dataValues.score = score;
  }
  */

  // res.send(organization)
};

exports.ESRfind = async (req, res) => {
  //console.log(req.body)
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  userRole = req.body.userRole;
  let fromDate = req.body.from_date;
  let toDate = req.body.to_date;
  let dateFilter = '';

  whereOrg = "";
  let query = "";

  if (
    req.body.organization_id == null ||
    req.body.organization_id == "" ||
    req.body.organization_id == undefined
  ) {
    return res.send([]);
  }

  if (req.body.organization_id) {
    whereOrg += ` A.organization_id='${req.body.organization_id}'`;
  }

  if (userRole == "Surveyor") {

    if (fromDate && toDate && fromDate != "" && toDate != "") {
      dateFilter = ` and (date_format(internal_surveyor_assesment_date, "%Y-%m-%d") between '${fromDate}' and '${toDate}' ||  date_format(external_surveyor_assesment_date, "%Y-%m-%d") between '${fromDate}' and '${toDate}')`;
    }


    whereUserRole =
      ` && (C.internal_surveyor_score is not null or C.external_surveyor_comment is not null ${dateFilter} )`;

  } else {

    if (fromDate && toDate && fromDate != "" && toDate != "") {
      dateFilter = ` and date_format(updator_assesment_date, "%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    whereUserRole = ` && C.updator_score is not null ${dateFilter} `;
  }

  query = `select (select count(*) from property_mapping as A left join sub_standards as B on  A.substandard_id = B.id &&  ${whereOrg}         
  where  ${whereOrg} && B.esr=1) as total_esr, 
  (select count(*) from property_mapping as A left join sub_standards as B on  A.substandard_id = B.id  &&  ${whereOrg}         
  where  ${whereOrg} && B.esr=2) as total_nonesr,    
   (select count(*) from property_mapping  as A left join sub_standards as B on B.id=A.substandard_id &&  ${whereOrg} 
      left join score_mapping as C on C.substanard_id  =B.id 
      where  ${whereOrg} && B.esr=1 ${whereUserRole}) as total_esr_complete,
  (select count(*) from property_mapping  as A left join sub_standards as B on B.id=A.substandard_id &&  ${whereOrg} 
      left join score_mapping as C on C.substanard_id  =B.id 
      where  ${whereOrg} && B.esr=2 ${whereUserRole}) as total_nonesr_complete     
  from score_mapping limit 1`;

  if (req.role_id == 2 || req.role_id == 3) {

    if (fromDate && toDate && fromDate != "" && toDate != "") {
      dateFilter = ` and date_format(updator_assesment_date, "%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    query = ` select 
    (select  count(distinct( A.id)) from sub_standards as A inner join activity_mapping as B on A.id = B.substandard_id && A.standard_id=B.standard_id  where A.esr=1 && B.library_id in (select library_id from organization_libraries where organization_id=${req.body.organization_id} && status=1)) as total_esr,  
     (select  count(distinct( A.id)) from sub_standards as A inner join activity_mapping as B on A.id = B.substandard_id && A.standard_id=B.standard_id  where A.esr !=1 && B.library_id in (select library_id from organization_libraries where organization_id=${req.body.organization_id} && status=1)) as total_nonesr,
     (select  count(distinct( A.id)) from sub_standards as A inner join activity_mapping as B on A.id = B.substandard_id && A.standard_id=B.standard_id left join score_mapping as C on C.substanard_id  =A.id  &&  C.organization_id=${req.body.organization_id}   where A.esr=1 && B.library_id in (select library_id from organization_libraries where organization_id=${req.body.organization_id} && status=1)  && C.updator_score is not null ${dateFilter} ) as total_esr_complete,
      (select  count(distinct( A.id)) from sub_standards as A inner join activity_mapping as B on A.id = B.substandard_id && A.standard_id=B.standard_id left join score_mapping as C on C.substanard_id  =A.id &&  C.organization_id=${req.body.organization_id}    where A.esr !=1 && B.library_id in (select library_id from organization_libraries where organization_id=${req.body.organization_id} && status=1)  && C.updator_score is not null ${dateFilter} ) as total_nonesr_complete`;
  }

  if (req.role_id == 6) {
    query = `select (select count(*) from property_mapping as A left join sub_standards as B on  A.substandard_id = B.id &&  ${whereOrg}         
  where  ${whereOrg} && B.esr=1  && A.user_id=${req.userId} && A.role_id=${req.role_id} ) as total_esr, 
  (select count(*) from property_mapping as A left join sub_standards as B on  A.substandard_id = B.id  &&  ${whereOrg}         
  where  ${whereOrg} && B.esr !=1   && A.user_id=${req.userId} && A.role_id=${req.role_id}) as total_nonesr,    
   (select count(*) from property_mapping  as A left join sub_standards as B on B.id=A.substandard_id &&  ${whereOrg}  && A.user_id=${req.userId} && A.role_id=${req.role_id} 
      left join score_mapping as C on C.substanard_id  =B.id   && C.organization_id=${req.body.organization_id}
      where  ${whereOrg} && B.esr=1 ${whereUserRole}) as total_esr_complete,
  (select count(*) from property_mapping  as A left join sub_standards as B on B.id=A.substandard_id &&  ${whereOrg}  && A.user_id=${req.userId} && A.role_id=${req.role_id} 
      left join score_mapping as C on C.substanard_id  =B.id   && C.organization_id=${req.body.organization_id}
      where  ${whereOrg} && B.esr !=1 ${whereUserRole}) as total_nonesr_complete     
  from score_mapping limit 1`;
  }

  console.log(query);

  await db.sequelize
    .query(query, {
      type: db.sequelize.QueryTypes.SELECT,
    })
    .then((esrData) => {
      if (esrData[0]) {
        total_esr = +esrData[0].total_esr;
        total_nonesr = +esrData[0].total_nonesr;
        totalSubstandard = total_esr + total_nonesr;
        total_esr_complete = +esrData[0].total_esr_complete;
        total_nonesr_complete = +esrData[0].total_nonesr_complete;
        total_esr_incomplete = total_esr - esrData[0].total_esr_complete;
        total_nonesr_incomplete =
          total_nonesr - esrData[0].total_nonesr_complete;

        if (totalSubstandard) {
          total_esr_per = (total_esr / totalSubstandard) * 100;
          total_nonesr_per = (total_nonesr / totalSubstandard) * 100;
        } else {
          total_esr_per = 0;
          total_nonesr_per = 0;
        }

        totalSubstandardComplete = total_esr_complete + total_nonesr_complete;
        if (total_esr) {
          total_esr_complete_per = (total_esr_complete / total_esr) * 100;
        } else total_esr_complete_per = 0;

        if (total_nonesr) {
          total_nonesr_complete_per =
            (total_nonesr_complete / total_nonesr) * 100;
        } else total_nonesr_complete_per = 0;

        totalSubstandardInComplete =
          total_esr_incomplete + total_nonesr_incomplete;

        //console.log(total_esr_incomplete);

        if (totalSubstandardInComplete) {
          total_esr_incomplete_per = (total_esr_incomplete / total_esr) * 100;
          total_nonesr_incomplete_per =
            (total_nonesr_incomplete / total_nonesr) * 100;
        } else {
          total_esr_incomplete_per = 0;
          total_nonesr_incomplete_per = 0;
        }
        // console.log(totalSubstandardInComplete);
        // console.log(total_esr_incomplete_per);

        esrData[0].total_esr_incomplete = total_esr_incomplete;
        esrData[0].total_nonesr_incomplete = total_nonesr_incomplete;
        esrData[0].total_esr_per = total_esr_per.toFixed(2);
        esrData[0].total_nonesr_per = total_nonesr_per.toFixed(2);
        esrData[0].total_esr_complete_per = total_esr_complete_per.toFixed(2);
        esrData[0].total_nonesr_complete_per =
          total_nonesr_complete_per.toFixed(2);
        esrData[0].total_esr_incomplete_per =
          total_esr_incomplete_per.toFixed(2);
        esrData[0].total_nonesr_incomplete_per =
          total_nonesr_incomplete_per.toFixed(2);
        res.send(esrData);
      } else res.send(esrData);
    });
};

exports.kpi = async (req, res) => {
  let query = ``;
  let activityOrganization = null;
  let organization_id = req.body.organization_id;
  let fromDate = req.body.from_date;
  let toDate = req.body.to_date;
  if (!organization_id || organization_id == undefined) {
    organization_id = req.organization_id;
  }

  if (req.body.type === "admin") {
    let where = ` st.admin_activity_id='${req.body.id}' and st.organization_id='${organization_id}' `;
    let activitynamesql = `select kpi_name from admin_activities where id='${req.body.id}'`;
    // if (req.body.to_date) {
    //   where = where + ` and el.createdAt <= '${req.body.to_date}' `;
    // }
    // if (req.body.from_date) {
    //   where = where + ` and el.createdAt >= '${req.body.from_date}' `;
    // }

    let activity = await db.activities_organization.findOne({
      where: {
        organization_id: req.organization_id,
        admin_activity_id: req.body.id
      }
    })


    if (!activity) {
      activity = await db.admin_activities.findOne({
        where: {
          id: req.body.id
        }
      })
    }

    let responseHeadList = [];

    if (fromDate && fromDate != "" && toDate && toDate != "") {
      responseHeadList = await helper.getResponseHead(
        fromDate,
        toDate,
        activity.response_frequency,
        activity.submission_day
      );

    } else {

      let today = new Date();
      fromDate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      toDate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();


      if (activity) {
        responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          activity.response_frequency,
          activity.submission_day
        );
      }

    }

 

    let start_responseDate = responseHeadList.length > 0 ? responseHeadList[0].responseDate : null;
    let end_responseDate = responseHeadList.length > 0 ? responseHeadList[responseHeadList.length - 1].responseEndDate : null;


    where =
      where +
      ` and date_format(el.responsedate,"%Y-%m-%d") between  '${start_responseDate}' and '${end_responseDate}' `;

    where = where + `group by frequency, YEAR(el.createdAt)`;
    query = `select concat(frequency,' ', YEAR(el.createdAt)) as frequency, avg(score) as score,(${activitynamesql}) as kpi_name,responsedate as date from storage_activity_kpi st inner join storage_activity_kpi_elements as el on st.id=el.storage_id where ${where}`;

    activityOrganization = await db.activities_organization.findOne({
      attributes: ["kpi_name"],
      where: {
        admin_activity_id: req.body.id,
        organization_id: organization_id,
        status: { [Op.notIn]: [master.status.delete] },
      },
    });
  } else {


//and st.organization_id='${organization_id}'

    let where = ` st.client_activity_id='${req.body.id}'  `;
    let activitynamesql = `select kpi_name from client_admin_activities where id='${req.body.id}'`;


    let responseHeadList = [];


    if (fromDate && fromDate != "" && toDate && toDate != "") {

      let activity = await db.client_admin_activities.findOne({
        where: {
          //  organization_id: req.organization_id,
          id: req.body.id
        }
      })


      responseHeadList = await helper.getResponseHead(
        fromDate,
        toDate,
        activity.response_frequency,
        activity.submission_day
      );
    } else {
      let clientactivity_kpi = await db.client_admin_activities.findOne({
        where: {
          // organization_id: req.organization_id,
          id: req.body.id
        }
      })

      let today = new Date();
      fromDate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      toDate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();

      if (clientactivity_kpi) {
        responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          clientactivity_kpi.response_frequency,
          clientactivity_kpi.submission_day
        );
      }

    }
    let start_responseDate = responseHeadList.length > 0 ? responseHeadList[0].responseDate : null;
    let end_responseDate = responseHeadList.length > 0 ? responseHeadList[responseHeadList.length - 1].responseEndDate : null;

    where =
      where +
      ` and date_format(el.responsedate,"%Y-%m-%d") between '${start_responseDate}' and '${end_responseDate}' `;


    where = where + `group by frequency, YEAR(el.createdAt)`;
    query = `select concat(frequency,' ', YEAR(el.createdAt)) as frequency, avg(score) as score,(${activitynamesql}) as kpi_name, responsedate  as date 
    from storage_activity_kpi st inner join storage_activity_kpi_elements as el on st.id=el.storage_id where ${where}`;
  }



  var scoredata = await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  if (scoredata && scoredata[0]) {
    if (activityOrganization) {
      scoredata[0].kpi_name = activityOrganization.kpi_name;
    }

    if(scoredata.length > 0) {
      scoredata = helper.sortByDate(scoredata);
    }

    res.send(scoredata);
  } else {
    res.send([]);
  }
};

//KPI List
exports.kpiList = async (req, res) => {
  let query = ``;
  let organization_id = req.organization_id;
  if (req.query.organization_id && req.query.organization_id != "") {
    organization_id = req.query.organization_id;
  }

  if (
    req.query.organization_id == undefined ||
    req.query.organization_id == "undefined"
  ) {
    organization_id = req.organization_id;
  }

  if (req.role_id === 4) {
    query = `SELECT DISTINCT  CONCAT(adm.admin_activity_id,'_admin') as id, adm.admin_activity_id as admin_activity_id, 
    adm.client_admin_activity as client_activity_id, adm.kpi_name as kpi_name FROM activities_organization adm INNER JOIN  
    activity_mapping act ON  adm.admin_activity_id=act.admin_activity_id INNER JOIN property_mapping pm ON 
    act.substandard_id = pm.substandard_id and pm.user_id=${req.userId}   where act.organization_id in (${organization_id},0) 
    and adm.status=1 and adm.type=2 and adm.kpi=1 and adm.organization_id=${organization_id}
    UNION
    SELECT DISTINCT CONCAT(adm.id,'_client') as id, null as admin_activity_id, adm.id as client_activity_id, adm.kpi_name as kpi_name 
    FROM client_admin_activities adm INNER JOIN  activity_mapping act ON adm.id=act.client_activity_id INNER JOIN property_mapping pm 
    ON act.substandard_id = pm.substandard_id and pm.user_id=${req.userId}  where act.organization_id in (${organization_id},0) 
    and adm.status=1 and adm.type=2 and adm.kpi=1 and adm.organization_id=${organization_id}
    `;
  } else {
    query = `SELECT DISTINCT CONCAT(adm.admin_activity_id,'_admin') as id, adm.admin_activity_id as admin_activity_id, 
    adm.client_admin_activity as client_activity_id, adm.kpi_name as kpi_name FROM activities_organization adm INNER JOIN  
    activity_mapping act ON adm.admin_activity_id=act.admin_activity_id   where act.organization_id in (${organization_id},0) 
    and adm.type=2 and adm.kpi=1 and adm.organization_id=${organization_id}
    UNION
    SELECT DISTINCT CONCAT(adm.id,'_client') as id,  null as admin_activity_id, adm.id as client_activity_id, adm.kpi_name as kpi_name 
    FROM client_admin_activities adm INNER JOIN  activity_mapping act ON adm.id=act.client_activity_id where 
    act.organization_id in (${organization_id},0) and adm.type=2 and adm.kpi=1 and adm.organization_id=${organization_id}`;
  }

  //console.log(query);

  let kpilist = await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  if (kpilist && kpilist.length > 0) {
    res.send(kpilist);
  } else {
    res.send([]);
  }
};

exports.observation = async (req, res) => {
  var query = ``;
  let activityOrganization = null;
  let clientactivityOrganization = null;
  let organization_id = req.body.organization_id;

  let fromDate = req.body.from_date;
  let toDate = req.body.to_date;

  if (!organization_id || organization_id == undefined) {
    organization_id = req.organization_id;
  }

  if (req.body.type === "admin") {
    let where = ` admin_activity_id='${req.body.id}' and organization_id='${organization_id}' `;
    let activitynamesql = `select observation_name from admin_activities where id='${req.body.id}'`;
    let obstypenamesql = `select observation_type from admin_activities where id='${req.body.id}'`;
    // if (req.body.to_date) {
    //   where = where + ` and createdAt <= '${req.body.to_date}' `;
    // }
    // if (req.body.from_date) {
    //   where = where + ` and createdAt >= '${req.body.from_date}' `;
    // }

    activityOrganization = await db.activities_organization.findOne({
      attributes: ["observation_name", "response_frequency", "submission_day"],
      where: {
        admin_activity_id: req.body.id,
        organization_id: organization_id,
        status: { [Op.notIn]: [master.status.delete] },
      },
    });

    if (!activityOrganization) {
      activityOrganization = await db.admin_activities.findOne({
        where: {
          id: req.body.id
        }
      })
    }

    let responseHeadList = [];

    if (fromDate && fromDate != "" && toDate && toDate != "") {
      responseHeadList = await helper.getResponseHead(
        fromDate,
        toDate,
        activityOrganization.response_frequency,
        activityOrganization.submission_day
      );

    } else {


      let today = new Date();
      fromDate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      toDate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      if (activityOrganization) {
        responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          activityOrganization.response_frequency,
          activityOrganization.submission_day
        );

      }

    }

    let start_responseDate = responseHeadList.length > 0 ? responseHeadList[0].responseDate : null;
    let end_responseDate = responseHeadList.length > 0 ? responseHeadList[responseHeadList.length - 1].responseEndDate : null;


    where =
      where +
      ` and date_format(responsedate,"%Y-%m-%d") between '${start_responseDate}' and '${end_responseDate}' `;

 


    // where = where + `group by frequency, YEAR(createdAt)`; freq same so its issue
    query = `select concat(frequency,' ', YEAR(createdAt)) as frequency,responsedate as freq_year,  currency, (${activitynamesql}) as observation, observation_type, responsedate as date 
    from storage_observation  where ${where}`;


  } else {
    //and organization_id='${organization_id}'
    let where = ` client_activity_id='${req.body.id}'  `;
    let activitynamesql = `select observation_name from client_admin_activities where id='${req.body.id}'`;
    let obstypenamesql = `select observation_type from admin_activities where id='${req.body.id}' && kpi=0`;

    clientactivityOrganization = await db.client_admin_activities.findOne({
      attributes: ["observation_name", "response_frequency", "submission_day"],
      where: {
        id: req.body.id,
        // organization_id: organization_id,
        status: { [Op.notIn]: [master.status.delete] },
      },
    });


    let responseHeadList = [];

    if (fromDate && fromDate != "" && toDate && toDate != "") {
      responseHeadList = await helper.getResponseHead(
        fromDate,
        toDate,
        clientactivityOrganization ? clientactivityOrganization.response_frequency : null,
        clientactivityOrganization ? clientactivityOrganization.submission_day : null
      );



    } else {
      let today = new Date();
      fromDate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      toDate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();

      if (clientactivityOrganization) {
        responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          clientactivityOrganization.response_frequency,
          clientactivityOrganization.submission_day
        );
      }

    }

    let start_responseDate = responseHeadList.length > 0 ? responseHeadList[0].responseDate : null;
    let end_responseDate = responseHeadList.length > 0 ? responseHeadList[responseHeadList.length - 1].responseEndDate : null;


    where =
      where +
      ` and date_format(responsedate,"%Y-%m-%d") between '${start_responseDate}' and '${end_responseDate}' `;

    // if (req.body.from_date) {
    //   where = where + ` and createdAt >= '${req.body.from_date}' `;
    // }

    //  where = where + `group by frequency, YEAR(responsedate)`;
    query = `select concat(frequency,' ', YEAR(responsedate)) as frequency, responsedate as freq_year, currency, (${activitynamesql}) as observation,  observation_type, responsedate as date  
    from storage_observation where ${where} order by responsedate`;

  }

  // console.log(query);
  var scoredata = await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });


  if (scoredata.length > 0) {
    if (activityOrganization) {


      if (activityOrganization.response_frequency != "Weekly") {

        let responseHeadList = await helper.getResponseHead(
          scoredata[0].freq_year,
          scoredata[0].freq_year,
          activityOrganization.response_frequency,
          activityOrganization.submission_day
        );
        let date = new Date(responseHeadList[0].responseDate);

        scoredata[0].frequency = activityOrganization.response_frequency
          ? responseHeadList[0].week + " " + date.getFullYear()
          : null;

      }


      if (activityOrganization.response_frequency == "Weekly") {

        let scrIdx = 0;
        for (const element of scoredata) {

          let responseHeadList = await helper.getResponseHead(
            element.freq_year,
            element.freq_year,
            activityOrganization.response_frequency,
            activityOrganization.submission_day
          );

          scoredata[scrIdx].frequency = activityOrganization.response_frequency
            ? responseHeadList[0].week : null;

          scoredata[scrIdx].observation = activityOrganization.observation_name
            ? activityOrganization.observation_name
            : null;

            scrIdx++;

        }

      }

    }



    if (clientactivityOrganization) {
      
      if (clientactivityOrganization.response_frequency != "Weekly") {
        let responseHeadList = await helper.getResponseHead(
          scoredata[0].freq_year,
          scoredata[0].freq_year,
          clientactivityOrganization.response_frequency,
          clientactivityOrganization.submission_day
        );
        // console.log(responseHeadList);

        let date = new Date(responseHeadList[0].responseDate);
        scoredata[0].frequency = clientactivityOrganization.response_frequency
          ? responseHeadList[0].week + " " + date.getFullYear()
          : null;
      }

      if (clientactivityOrganization.response_frequency == "Weekly") {
        let scrIdx = 0;
        for (const element of scoredata) {
          let responseHeadList = await helper.getResponseHead(
            element.freq_year,
            element.freq_year,
            clientactivityOrganization.response_frequency,
            clientactivityOrganization.submission_day
          );

          scoredata[scrIdx].frequency = clientactivityOrganization.response_frequency
            ? responseHeadList[0].week : null;

          scrIdx++;
        }

      }

    }

    if(scoredata.length > 0) {
      scoredata = helper.sortByDate(scoredata);
    }

    res.send(scoredata);
  } else {
    res.send([]);
  }
};

exports.observationlist = async (req, res) => {
  let query = ``;
  let query2 = ``;
  let organization_id = req.organization_id;
  if (req.query.organization_id && req.query.organization_id != "") {
    organization_id = req.query.organization_id;
  }

  if (
    req.query.organization_id == undefined ||
    req.query.organization_id == "undefined"
  ) {
    organization_id = req.organization_id;
  }

  // if (req.role_id === 4) {
  //   query = `SELECT DISTINCT  CONCAT(adm.admin_activity_id,'_admin') as id, adm.admin_activity_id as admin_activity_id, adm.client_admin_activity as client_activity_id, adm.observation_name as observation_name FROM activities_organization adm INNER JOIN  activity_mapping act ON  adm.admin_activity_id=act.admin_activity_id INNER JOIN property_mapping pm ON act.substandard_id = pm.substandard_id and pm.user_id=${req.userId}   where act.organization_id in (${req.organization_id},0) and adm.status=1 and adm.type=2   and adm.kpi=0  and adm.observation_name is NOT NULL and adm.observation_name != '' and adm.organization_id=${req.organization_id}
  //   UNION
  //   SELECT DISTINCT CONCAT(adm.id,'_client') as id, null as admin_activity_id, adm.id as client_activity_id, adm.observation_name as observation_name FROM client_admin_activities adm INNER JOIN  activity_mapping act ON adm.id=act.client_activity_id INNER JOIN property_mapping pm ON act.substandard_id = pm.substandard_id and pm.user_id=${req.userId}  where  act.organization_id in (${req.organization_id},0) and adm.status=1 and adm.type=2   and adm.kpi=0  and adm.observation_name is NOT NULL and adm.observation_name != '' and adm.organization_id=${req.organization_id}
  //   `;
  // } else {
  //   query = `SELECT DISTINCT CONCAT(adm.admin_activity_id,'_admin') as id, adm.admin_activity_id as admin_activity_id, adm.client_admin_activity as client_activity_id, adm.observation_name as observation_name FROM activities_organization adm INNER JOIN  activity_mapping act ON adm.admin_activity_id=act.admin_activity_id   where act.organization_id in (${req.organization_id},0) and adm.type=2  and adm.kpi=0  and adm.observation_name is NOT NULL and adm.observation_name != '' and adm.organization_id=${req.organization_id}
  //   UNION
  //   SELECT DISTINCT CONCAT(adm.id,'_client') as id,  null as admin_activity_id, adm.id as client_activity_id, adm.observation_name as observation_name FROM client_admin_activities adm INNER JOIN  activity_mapping act ON adm.id=act.client_activity_id where act.organization_id in (${req.organization_id},0) and adm.type=2  and adm.kpi=0  and adm.observation_name is NOT NULL and adm.observation_name != '' and adm.organization_id=${req.organization_id}`;
  // }

  if (req.role_id == 4) {
    query = `SELECT DISTINCT  CONCAT(adm.admin_activity_id,'_admin') as id, adm.admin_activity_id as admin_activity_id, 
    adm.client_admin_activity as client_activity_id, adm.observation_name as observation_name FROM activities_organization adm 
    INNER JOIN  activity_mapping act ON  adm.admin_activity_id=act.admin_activity_id INNER JOIN property_mapping pm 
    ON act.substandard_id = pm.substandard_id and pm.user_id=${req.userId}   where act.organization_id in (${organization_id},0) 
    and adm.status=1 and adm.type=2   and adm.kpi=0  and adm.observation_name is NOT NULL and adm.observation_name != '' and 
    adm.organization_id=${organization_id}
     UNION
    SELECT DISTINCT CONCAT(adm.id,'_client') as id, null as admin_activity_id, adm.id as client_activity_id, 
    adm.observation_name as observation_name FROM client_admin_activities adm INNER JOIN  activity_mapping act 
    ON adm.id=act.client_activity_id INNER JOIN property_mapping pm ON act.substandard_id = pm.substandard_id 
    and pm.user_id=${req.userId}  where  act.organization_id in (${organization_id},0) and adm.status=1 and adm.type=2   
    and adm.kpi=0  and adm.observation_name is NOT NULL and adm.observation_name != '' and adm.organization_id=${organization_id}
    `;
  } else if (req.role_id == 2 || req.role_id == 3) {
    query = `SELECT DISTINCT CONCAT(adm.admin_activity_id,'_admin') as id, adm.admin_activity_id as admin_activity_id, 
    adm.client_admin_activity as client_activity_id, adm.observation_name as observation_name FROM activities_organization adm 
    INNER JOIN  activity_mapping act ON adm.admin_activity_id=act.admin_activity_id   where 
    act.organization_id in (${organization_id},0) and adm.type=2  and adm.kpi=0  and adm.observation_name is NOT NULL 
    and adm.observation_name != '' and adm.organization_id=${organization_id}
    UNION
    SELECT DISTINCT CONCAT(adm.id,'_client') as id,  null as admin_activity_id, adm.id as client_activity_id, 
    adm.observation_name as observation_name FROM client_admin_activities adm INNER JOIN  activity_mapping act 
    ON adm.id=act.client_activity_id where act.organization_id in (${organization_id},0) and adm.type=2  and adm.kpi=0  
    and adm.observation_name is NOT NULL and adm.observation_name != '' and adm.organization_id=${organization_id}`;
  } else {
    query = `SELECT DISTINCT  CONCAT(adm.admin_activity_id,'_admin') as id, adm.admin_activity_id as admin_activity_id, 
    adm.client_admin_activity as client_activity_id, adm.observation_name as observation_name FROM activities_organization adm 
    INNER JOIN  activity_mapping act ON  adm.admin_activity_id=act.admin_activity_id INNER JOIN property_mapping pm 
    ON act.substandard_id = pm.substandard_id and pm.user_id=${req.userId}   where act.organization_id in (${organization_id},0) 
    and adm.status=1 and adm.type=2   and adm.kpi=0  and adm.observation_name is NOT NULL and adm.observation_name != '' and 
    adm.organization_id=${organization_id}
     UNION
    SELECT DISTINCT CONCAT(adm.id,'_client') as id, null as admin_activity_id, adm.id as client_activity_id, 
    adm.observation_name as observation_name FROM client_admin_activities adm INNER JOIN  activity_mapping act ON 
    adm.id=act.client_activity_id INNER JOIN property_mapping pm ON act.substandard_id = pm.substandard_id and 
    pm.user_id=${req.userId}  where  act.organization_id in (${organization_id},0) and adm.status=1 and adm.type=2  
     and adm.kpi=0  and adm.observation_name is NOT NULL and adm.observation_name != '' and adm.organization_id=${organization_id}
    `;
  }

  query2 = `SELECT DISTINCT  CONCAT(adm.id,'_admin') as id, adm.id as admin_activity_id, null as client_activity_id, 
  adm.observation_name as observation_name FROM admin_activities adm INNER JOIN  activity_mapping act ON  
  adm.id=act.admin_activity_id INNER JOIN property_mapping pm ON act.substandard_id = pm.substandard_id and 
  pm.user_id=${req.userId}   where act.organization_id in (${organization_id},0) and adm.status=1 and adm.type=2   
  and adm.kpi=0  and adm.observation_name is NOT NULL and adm.observation_name != '' `;

  if (req.role_id == 2 || req.role_id == 3) {
    query2 = `SELECT DISTINCT  CONCAT(adm.id,'_admin') as id, adm.id as admin_activity_id, null as client_activity_id, 
    adm.observation_name as observation_name FROM admin_activities adm INNER JOIN  activity_mapping act ON  
    adm.id=act.admin_activity_id   where act.organization_id in (${organization_id},0) and adm.status=1 and 
    adm.type=2   and adm.kpi=0  and adm.observation_name is NOT NULL and adm.observation_name != ''  
    and library_id in (select library_id from organization_libraries where organization_id=${organization_id} and status=1)`;
  }

  //console.log(query2);

  const obsList = await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  const obsList2 = await db.sequelize.query(query2, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  let activityList = [...obsList, ...obsList2];

  const uiniqueActivity = Array.from(
    new Set(activityList.map((a) => a.admin_activity_id))
  );

  // .map((el) => {
  //   if (el) {
  //     return activityList.find((a) => a.admin_activity_id == el);
  //   } else {
  //     return activityList.filter((a) => a.admin_activity_id == el);
  //   }
  // });

  const uniqueAdminAct = uiniqueActivity
    .map((el) => {
      if (el && el !== "undefined") {
        return activityList.find((a) => a.admin_activity_id == el);
      }
    })
    .filter((el) => el != null);

  const uniqueClientAct = activityList.filter((el) => {
    return el.client_activity_id !== null;
  });

  //uniqueAdminAct.concat(uniqueClientAct);
  let realActivities = [...uniqueAdminAct, ...uniqueClientAct];

  if (realActivities && realActivities.length > 0) {
    res.send(realActivities);
  } else {
    res.send([]);
  }
};
//Updator Dashboard
exports.UpdatorcomplianceMet = async (req, res) => {
  //console.log(req.headers);
  let organization_id = req.organization_id;
  let fromDate = req.body.from_date;
  let toDate = req.body.to_date;
  if (req.query.organization_id) {
    organization_id = req.query.organization_id;
  }

  if (organization_id == undefined || organization_id == "undefined") {
    organization_id = req.organization_id;
  }

  let role = req.body.role;

  if (role == "") {
    role == "Updater";
  }

  let library_id = req.body.library_id ? req.body.library_id : null;

  let users = await db.users.findAll({
    where: {
      organization_id: organization_id,
      role_id: 4,
      status: 1,
    },
  });

  if (!library_id) {
    let prop_mapping = await db.property_mapping.findOne({
      where: {
        role_id: req.role_id,
        organization_id: req.organization_id,
        user_id: req.userId,
      },
    });

    if (prop_mapping) {
      library_id = prop_mapping.library_id;
    }
  }

  if (req.role_id == 2 || req.role_id == 3 || req.role_id == 6) {
    console.log("client admin");

    if (role == "Updater" || role == "Updator") {
      users = await db.sequelize.query(
        `select B.* from property_mapping as A left join users as B on A.user_id= B.id
      where A.organization_id=${organization_id}  and B.organization_id=${organization_id}  and A.role_id=4 and library_id=${library_id} and B.status not in(2)  and (A.status not in(2) or A.status is null )  group by library_id,user_id`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      // console.log(users);
    } else if (role == "Internalsurveyor") {
      users = await db.sequelize.query(
        `select B.* from property_mapping as A left join users as B on A.user_id= B.id
      where A.organization_id=${organization_id}  and B.organization_id=${organization_id}  and A.role_id=5 and surveyor_type=1 and library_id=${library_id} and B.status not in(2)  and (A.status not in(2) or A.status is null )  group by library_id,user_id`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
    } else if (role == "Externalsurveyor") {
      users = await db.sequelize.query(
        `select B.* from property_mapping as A left join users as B on A.user_id= B.id
      where A.organization_id=${organization_id}  and B.organization_id=${organization_id}  and A.role_id=5 and surveyor_type=2 and library_id=${library_id} and B.status not in(2)  and (A.status not in(2) or A.status is null )  group by library_id,user_id`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
    }

    let scorewhereprop = "updator_score";
    let libscores = [];
    let chapterScores = [];
    let standardScores = [];
    let subStandardScores = [];

    let substandardMetCount = 0;
    let substandardMetCountper = 0;
    let substandardPartialyMetCount = 0;
    let substandardPartialyMetCountper = 0;
    let substandardNotMetCount = 0;
    let substandardNotMetCountper = 0;
    let chapterMetCount = 0;
    let chapterMetCountper = 0;
    let chapterPartialyMetCount = 0;
    let chapterPartialyMetCountper = 0;
    let chapterNotMetCount = 0;
    let chapterNotMetCountper = 0;
    let libraryMetCount = 0;
    let libraryMetCountper = 0;
    let libraryPartialyMetCount = 0;
    let libraryPartialyMetCountper = 0;
    let libraryNotMetCount = 0;
    let libraryNotMetCountper = 0;
    let standardMetCount = 0;
    let standardMetCountper = 0;
    let standardPartialyMetCount = 0;
    let standardPartialyMetCountper = 0;
    let standardNotMetCount = 0;
    let standardNotMetCountper = 0;
    let surveyorType = 0;

    for (const element of users) {
      if (role == "Updater" || role == "Updator") {
        surveyorType = 0;
      } else if (role == "Internalsurveyor") {
        surveyorType = 1;
      } else if (role == "Externalsurveyor") {
        surveyorType = 2;
      }

      //console.log(element.id);

      let libscore = await helper.getLibraryScoreUpdatorSurveyorComp(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        organization_id,
        fromDate,
        toDate
      );




      let chapterScore = await helper.getChapterScoreUpdatorSurv(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        organization_id,
        fromDate,
        toDate
      );

      let standardScore = await helper.getStandardScoreUpdatorSurv(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        organization_id,
        fromDate,
        toDate
      );

      let substandardScore = await helper.getSubstandardScoreUpdatorSurv(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        organization_id,
        fromDate,
        toDate
      );

      //console.log(substandardScore);
      libscores.push(+libscore);
      chapterScores.push(+chapterScore);
      standardScores.push(+standardScore);
      subStandardScores.push(+substandardScore);
    } //end loop

    libscores =
      libscores.length > 0
        ? libscores.reduce((a, b) => a + b) / libscores.length
        : 0;

    chapterScores =
      chapterScores.length > 0
        ? chapterScores.reduce((a, b) => a + b) / chapterScores.length
        : 0;

    standardScores =
      standardScores.length > 0
        ? standardScores.reduce((a, b) => a + b) / standardScores.length
        : 0;

    subStandardScores =
      subStandardScores.length > 0
        ? subStandardScores.reduce((a, b) => a + b) / subStandardScores.length
        : 0;

    let [totalsubstandardcount] = await db.sequelize.query(
      ` select (select count(distinct(substanard_id)) from score_mapping where library_id=${library_id} and organization_id=${organization_id} AND ${scorewhereprop} = 2 ) as libraryMetCount,
    (select count(distinct(substanard_id)) from score_mapping where library_id=${library_id} and organization_id=${organization_id}  AND ${scorewhereprop} = 0 ) as libraryNotMetCount,
    (select count(distinct(substanard_id)) from score_mapping where library_id=${library_id} and organization_id=${organization_id}  AND ${scorewhereprop} = 1)  as libraryPartiallyMetCount `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (totalsubstandardcount) {
      let totalCount =
        totalsubstandardcount.libraryMetCount +
        totalsubstandardcount.libraryNotMetCount +
        totalsubstandardcount.libraryPartiallyMetCount;

      if (totalCount > 0) {
        let metPer = (totalsubstandardcount.libraryMetCount / totalCount) * 100;
        let partiallyMetPer =
          (totalsubstandardcount.libraryPartiallyMetCount / totalCount) * 100;
        let notMetPer =
          (totalsubstandardcount.libraryNotMetCount / totalCount) * 100;
        // console.log(metPer, subStandardScores);
        //substandard
        substandardMetCountper = (metPer * subStandardScores) / 100;

        substandardPartialyMetCountper =
          (partiallyMetPer * subStandardScores) / 100;
        substandardNotMetCountper = (notMetPer * subStandardScores) / 100;

        //standard

        standardMetCountper = (metPer * standardScores) / 100;
        standardPartialyMetCountper = (partiallyMetPer * standardScores) / 100;
        standardNotMetCountper = (notMetPer * standardScores) / 100;

        //chapter

        chapterMetCountper = (metPer * chapterScores) / 100;
        chapterPartialyMetCountper = (partiallyMetPer * chapterScores) / 100;
        chapterNotMetCountper = (notMetPer * chapterScores) / 100;

        //library

        libraryMetCountper = (metPer * libscores) / 100;
        libraryPartialyMetCountper = (partiallyMetPer * libscores) / 100;
        libraryNotMetCountper = (notMetPer * libscores) / 100;
      }

      substandardMetCount = totalsubstandardcount.libraryMetCount;
      substandardMetCountper = substandardMetCountper.toFixed(2);
      substandardPartialyMetCount =
        totalsubstandardcount.libraryPartiallyMetCount;
      substandardPartialyMetCountper =
        substandardPartialyMetCountper.toFixed(2);
      substandardNotMetCount = totalsubstandardcount.libraryNotMetCount;
      substandardNotMetCountper = substandardNotMetCountper.toFixed(2);

      chapterMetCount = totalsubstandardcount.libraryMetCount;
      chapterMetCountper = chapterMetCountper.toFixed(2);
      chapterPartialyMetCount = totalsubstandardcount.libraryPartiallyMetCount;
      chapterPartialyMetCountper = chapterPartialyMetCountper.toFixed(2);
      chapterNotMetCount = totalsubstandardcount.libraryNotMetCount;
      chapterNotMetCountper = chapterNotMetCountper.toFixed(2);

      libraryMetCount = totalsubstandardcount.libraryMetCount;
      libraryMetCountper = libraryMetCountper.toFixed(2);
      libraryPartialyMetCount = totalsubstandardcount.libraryPartiallyMetCount;
      libraryPartialyMetCountper = libraryPartialyMetCountper.toFixed(2);
      libraryNotMetCount = totalsubstandardcount.libraryNotMetCount;
      libraryNotMetCountper = libraryNotMetCountper.toFixed(2);

      standardMetCount = totalsubstandardcount.libraryMetCount;
      standardMetCountper = standardMetCountper.toFixed(2);
      standardPartialyMetCount = totalsubstandardcount.libraryPartiallyMetCount;
      standardPartialyMetCountper = standardPartialyMetCountper.toFixed(2);
      standardNotMetCount = totalsubstandardcount.libraryNotMetCount;
      standardNotMetCountper = standardNotMetCountper.toFixed(2);
    }

    return res.send({
      libscores,
      chapterScores,
      standardScores,
      subStandardScores,
      substandardMetCount,
      substandardMetCountper,
      substandardPartialyMetCount,
      substandardPartialyMetCountper,
      substandardNotMetCount,
      substandardNotMetCountper,
      chapterMetCount,
      chapterMetCountper,
      chapterPartialyMetCount,
      chapterPartialyMetCountper,
      chapterNotMetCount,
      chapterNotMetCountper,
      libraryMetCount,
      libraryMetCountper,
      libraryPartialyMetCount,
      libraryPartialyMetCountper,
      libraryNotMetCount,
      libraryNotMetCountper,
      standardMetCount,
      standardMetCountper,
      standardPartialyMetCount,
      standardPartialyMetCountper,
      standardNotMetCount,
      standardNotMetCountper,
    });
  } else if (req.role_id == 4) {
    const users = await db.users.findAll({
      where: {
        organization_id: organization_id,
        role_id: 4,
        status: 1,
        id: req.userId,
      },
    });

    let scorewhereprop = "updator_score";
    let libscores = [];
    let chapterScores = [];
    let standardScores = [];
    let subStandardScores = [];

    let substandardMetCount = 0;
    let substandardMetCountper = 0;
    let substandardPartialyMetCount = 0;
    let substandardPartialyMetCountper = 0;
    let substandardNotMetCount = 0;
    let substandardNotMetCountper = 0;
    let chapterMetCount = 0;
    let chapterMetCountper = 0;
    let chapterPartialyMetCount = 0;
    let chapterPartialyMetCountper = 0;
    let chapterNotMetCount = 0;
    let chapterNotMetCountper = 0;
    let libraryMetCount = 0;
    let libraryMetCountper = 0;
    let libraryPartialyMetCount = 0;
    let libraryPartialyMetCountper = 0;
    let libraryNotMetCount = 0;
    let libraryNotMetCountper = 0;
    let standardMetCount = 0;
    let standardMetCountper = 0;
    let standardPartialyMetCount = 0;
    let standardPartialyMetCountper = 0;
    let standardNotMetCount = 0;
    let standardNotMetCountper = 0;
    let surveyorType = 0;

    for (const element of users) {


      let libscore = await helper.getLibraryScoreUpdatorSurveyorComp(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        req.organization_id,
        fromDate,
        toDate
      );



      let chapterScore = await helper.getChapterScoreUpdatorSurv(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        req.organization_id,
        fromDate,
        toDate
      );

      let standardScore = await helper.getStandardScoreUpdatorSurv(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        req.organization_id,
        fromDate,
        toDate
      );

      let substandardScore = await helper.getSubstandardScoreUpdatorSurv(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        req.organization_id,
        fromDate,
        toDate
      );
      // console.log(chapterScore);
      libscores.push(+libscore);
      chapterScores.push(+chapterScore);
      standardScores.push(+standardScore);
      subStandardScores.push(+substandardScore);
    } //end loop

    libscores =
      libscores.length > 0
        ? libscores.reduce((a, b) => a + b) / libscores.length
        : 0;

    chapterScores =
      chapterScores.length > 0
        ? chapterScores.reduce((a, b) => a + b) / chapterScores.length
        : 0;

    standardScores =
      standardScores.length > 0
        ? standardScores.reduce((a, b) => a + b) / standardScores.length
        : 0;

    subStandardScores =
      subStandardScores.length > 0
        ? subStandardScores.reduce((a, b) => a + b) / subStandardScores.length
        : 0;

    let [totalsubstandardcount] = await db.sequelize.query(
      ` select (select count(distinct(substanard_id)) from score_mapping where library_id=${library_id} and organization_id=${organization_id} AND ${scorewhereprop} = 2  and updator_id=${req.userId}) as libraryMetCount,
    (select count(distinct(substanard_id)) from score_mapping where library_id=${library_id} and organization_id=${organization_id}  AND ${scorewhereprop} = 0  and updator_id=${req.userId}) as libraryNotMetCount,
    (select count(distinct(substanard_id)) from score_mapping where library_id=${library_id} and organization_id=${organization_id}  AND ${scorewhereprop} = 1 and updator_id=${req.userId})  as libraryPartiallyMetCount `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );




    if (totalsubstandardcount) {
      let totalCount =
        totalsubstandardcount.libraryMetCount +
        totalsubstandardcount.libraryNotMetCount +
        totalsubstandardcount.libraryPartiallyMetCount;
      if (totalCount > 0) {
        let metPer = (totalsubstandardcount.libraryMetCount / totalCount) * 100;
        let partiallyMetPer =
          (totalsubstandardcount.libraryPartiallyMetCount / totalCount) * 100;
        let notMetPer =
          (totalsubstandardcount.libraryNotMetCount / totalCount) * 100;

        //substandard
        substandardMetCountper = (metPer * subStandardScores) / 100;
        substandardPartialyMetCountper =
          (partiallyMetPer * subStandardScores) / 100;
        substandardNotMetCountper = (notMetPer * subStandardScores) / 100;

        //standard

        standardMetCountper = (metPer * standardScores) / 100;
        standardPartialyMetCountper = (partiallyMetPer * standardScores) / 100;
        standardNotMetCountper = (notMetPer * standardScores) / 100;

        //chapter

        chapterMetCountper = (metPer * chapterScores) / 100;
        chapterPartialyMetCountper = (partiallyMetPer * chapterScores) / 100;
        chapterNotMetCountper = (notMetPer * chapterScores) / 100;

        //library

        libraryMetCountper = (metPer * libscores) / 100;
        libraryPartialyMetCountper = (partiallyMetPer * libscores) / 100;
        libraryNotMetCountper = (notMetPer * libscores) / 100;
      }

      substandardMetCount = totalsubstandardcount.libraryMetCount;
      substandardMetCountper = substandardMetCountper.toFixed(2);
      substandardPartialyMetCount =
        totalsubstandardcount.libraryPartiallyMetCount;
      substandardPartialyMetCountper =
        substandardPartialyMetCountper.toFixed(2);
      substandardNotMetCount = totalsubstandardcount.libraryNotMetCount;
      substandardNotMetCountper = substandardNotMetCountper.toFixed(2);

      chapterMetCount = totalsubstandardcount.libraryMetCount;
      chapterMetCountper = chapterMetCountper.toFixed(2);
      chapterPartialyMetCount = totalsubstandardcount.libraryPartiallyMetCount;
      chapterPartialyMetCountper = chapterPartialyMetCountper.toFixed(2);
      chapterNotMetCount = totalsubstandardcount.libraryNotMetCount;
      chapterNotMetCountper = chapterNotMetCountper.toFixed(2);

      libraryMetCount = totalsubstandardcount.libraryMetCount;
      libraryMetCountper = libraryMetCountper.toFixed(2);
      libraryPartialyMetCount = totalsubstandardcount.libraryPartiallyMetCount;
      libraryPartialyMetCountper = libraryPartialyMetCountper.toFixed(2);
      libraryNotMetCount = totalsubstandardcount.libraryNotMetCount;
      libraryNotMetCountper = libraryNotMetCountper.toFixed(2);

      standardMetCount = totalsubstandardcount.libraryMetCount;
      standardMetCountper = standardMetCountper.toFixed(2);
      standardPartialyMetCount = totalsubstandardcount.libraryPartiallyMetCount;
      standardPartialyMetCountper = standardPartialyMetCountper.toFixed(2);
      standardNotMetCount = totalsubstandardcount.libraryNotMetCount;
      standardNotMetCountper = standardNotMetCountper.toFixed(2);
    }

    return res.send({
      libscores,
      chapterScores,
      standardScores,
      subStandardScores,
      substandardMetCount,
      substandardMetCountper,
      substandardPartialyMetCount,
      substandardPartialyMetCountper,
      substandardNotMetCount,
      substandardNotMetCountper,
      chapterMetCount,
      chapterMetCountper,
      chapterPartialyMetCount,
      chapterPartialyMetCountper,
      chapterNotMetCount,
      chapterNotMetCountper,
      libraryMetCount,
      libraryMetCountper,
      libraryPartialyMetCount,
      libraryPartialyMetCountper,
      libraryNotMetCount,
      libraryNotMetCountper,
      standardMetCount,
      standardMetCountper,
      standardPartialyMetCount,
      standardPartialyMetCountper,
      standardNotMetCount,
      standardNotMetCountper,
    });
  } else if (req.role_id == 5) {
    const users = await db.users.findAll({
      where: {
        organization_id: organization_id,
        role_id: 5,
        status: 1,
        id: req.userId,
      },
    });


    let scorewhereprop = "updator_score";
    let surveyortypeProp = null;
    let libscores = [];
    let chapterScores = [];
    let standardScores = [];
    let subStandardScores = [];

    let substandardMetCount = 0;
    let substandardMetCountper = 0;
    let substandardPartialyMetCount = 0;
    let substandardPartialyMetCountper = 0;
    let substandardNotMetCount = 0;
    let substandardNotMetCountper = 0;
    let chapterMetCount = 0;
    let chapterMetCountper = 0;
    let chapterPartialyMetCount = 0;
    let chapterPartialyMetCountper = 0;
    let chapterNotMetCount = 0;
    let chapterNotMetCountper = 0;
    let libraryMetCount = 0;
    let libraryMetCountper = 0;
    let libraryPartialyMetCount = 0;
    let libraryPartialyMetCountper = 0;
    let libraryNotMetCount = 0;
    let libraryNotMetCountper = 0;
    let standardMetCount = 0;
    let standardMetCountper = 0;
    let standardPartialyMetCount = 0;
    let standardPartialyMetCountper = 0;
    let standardNotMetCount = 0;
    let standardNotMetCountper = 0;
    let surveyorType = users.length > 0 ? users[0].surveyor_type : 1;

    if (surveyorType == 1) {
      scorewhereprop = "internal_surveyor_score";
      surveyortypeProp = "internal_surveyor_id";
    } else if (surveyorType == 2) {
      scorewhereprop = "external_surveyor_score";
      surveyortypeProp = "external_surveyor_id";
    }


    for (const element of users) {
      // if (role == "Updater") {
      //   surveyorType = 0;
      // } else if (role == "Internalsurveyor") {
      //   surveyorType = 1;
      // } else if (role == "Externalsurveyor") {
      //   surveyorType = 2;
      // }

      surveyorType = element.surveyor_type;

      let libscore = await helper.getLibraryScoreUpdatorSurveyorComp(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        req.organization_id,
        fromDate,
        toDate
      );



      let chapterScore = await helper.getChapterScoreUpdatorSurv(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        req.organization_id,
        fromDate,
        toDate
      );

      let standardScore = await helper.getStandardScoreUpdatorSurv(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        req.organization_id,
        fromDate,
        toDate
      );



      let substandardScore = await helper.getSubstandardScoreUpdatorSurv(
        req,
        library_id,
        element.id,
        surveyorType,
        null,
        null,
        null,
        null,
        req.organization_id,
        fromDate,
        toDate
      );

      //console.log(substandardScore);
      libscores.push(libscore);
      chapterScores.push(chapterScore);
      standardScores.push(standardScore);
      subStandardScores.push(substandardScore);
    } //end loop

    libscores =
      libscores.length > 0
        ? libscores.reduce((a, b) => a + b) / libscores.length
        : 0;

    chapterScores =
      chapterScores.length > 0
        ? chapterScores.reduce((a, b) => a + b) / chapterScores.length
        : 0;

    standardScores =
      standardScores.length > 0
        ? standardScores.reduce((a, b) => a + b) / standardScores.length
        : 0;

    subStandardScores =
      subStandardScores.length > 0
        ? subStandardScores.reduce((a, b) => a + b) / subStandardScores.length
        : 0;


    let [totalsubstandardcount] = await db.sequelize.query(
      ` select (select count(distinct(substanard_id)) from score_mapping where library_id=${library_id} and organization_id=${organization_id} AND ${scorewhereprop} = 2 &&  ${surveyortypeProp}=${req.userId}) as libraryMetCount,
    (select count(distinct(substanard_id)) from score_mapping where library_id=${library_id} and organization_id=${organization_id}  AND ${scorewhereprop} = 0  &&  ${surveyortypeProp}=${req.userId}) as libraryNotMetCount,
    (select count(distinct(substanard_id)) from score_mapping where library_id=${library_id} and organization_id=${organization_id}  AND ${scorewhereprop} = 1 &&  ${surveyortypeProp}=${req.userId})  as libraryPartiallyMetCount `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (totalsubstandardcount) {
      let totalCount =
        totalsubstandardcount.libraryMetCount +
        totalsubstandardcount.libraryNotMetCount +
        totalsubstandardcount.libraryPartiallyMetCount;
      if (totalCount > 0) {
        let metPer = (totalsubstandardcount.libraryMetCount / totalCount) * 100;
        let partiallyMetPer =
          (totalsubstandardcount.libraryPartiallyMetCount / totalCount) * 100;
        let notMetPer =
          (totalsubstandardcount.libraryNotMetCount / totalCount) * 100;

        //substandard
        substandardMetCountper = (metPer * subStandardScores) / 100;
        substandardPartialyMetCountper =
          (partiallyMetPer * subStandardScores) / 100;
        substandardNotMetCountper = (notMetPer * subStandardScores) / 100;

        //standard

        standardMetCountper = (metPer * standardScores) / 100;
        standardPartialyMetCountper = (partiallyMetPer * standardScores) / 100;
        standardNotMetCountper = (notMetPer * standardScores) / 100;

        //chapter

        chapterMetCountper = (metPer * chapterScores) / 100;
        chapterPartialyMetCountper = (partiallyMetPer * chapterScores) / 100;
        chapterNotMetCountper = (notMetPer * chapterScores) / 100;

        //library

        libraryMetCountper = (metPer * libscores) / 100;
        libraryPartialyMetCountper = (partiallyMetPer * libscores) / 100;
        libraryNotMetCountper = (notMetPer * libscores) / 100;
      }

      substandardMetCount = totalsubstandardcount.libraryMetCount;
      substandardMetCountper = substandardMetCountper.toFixed(2);
      substandardPartialyMetCount =
        totalsubstandardcount.libraryPartiallyMetCount;
      substandardPartialyMetCountper =
        substandardPartialyMetCountper.toFixed(2);
      substandardNotMetCount = totalsubstandardcount.libraryNotMetCount;
      substandardNotMetCountper = substandardNotMetCountper.toFixed(2);

      chapterMetCount = totalsubstandardcount.libraryMetCount;
      chapterMetCountper = chapterMetCountper.toFixed(2);
      chapterPartialyMetCount = totalsubstandardcount.libraryPartiallyMetCount;
      chapterPartialyMetCountper = chapterPartialyMetCountper.toFixed(2);
      chapterNotMetCount = totalsubstandardcount.libraryNotMetCount;
      chapterNotMetCountper = chapterNotMetCountper.toFixed(2);

      libraryMetCount = totalsubstandardcount.libraryMetCount;
      libraryMetCountper = libraryMetCountper.toFixed(2);
      libraryPartialyMetCount = totalsubstandardcount.libraryPartiallyMetCount;
      libraryPartialyMetCountper = libraryPartialyMetCountper.toFixed(2);
      libraryNotMetCount = totalsubstandardcount.libraryNotMetCount;
      libraryNotMetCountper = libraryNotMetCountper.toFixed(2);

      standardMetCount = totalsubstandardcount.libraryMetCount;
      standardMetCountper = standardMetCountper.toFixed(2);
      standardPartialyMetCount = totalsubstandardcount.libraryPartiallyMetCount;
      standardPartialyMetCountper = standardPartialyMetCountper.toFixed(2);
      standardNotMetCount = totalsubstandardcount.libraryNotMetCount;
      standardNotMetCountper = standardNotMetCountper.toFixed(2);
    }

    return res.send({
      libscores,
      chapterScores,
      standardScores,
      subStandardScores,
      substandardMetCount,
      substandardMetCountper,
      substandardPartialyMetCount,
      substandardPartialyMetCountper,
      substandardNotMetCount,
      substandardNotMetCountper,
      chapterMetCount,
      chapterMetCountper,
      chapterPartialyMetCount,
      chapterPartialyMetCountper,
      chapterNotMetCount,
      chapterNotMetCountper,
      libraryMetCount,
      libraryMetCountper,
      libraryPartialyMetCount,
      libraryPartialyMetCountper,
      libraryNotMetCount,
      libraryNotMetCountper,
      standardMetCount,
      standardMetCountper,
      standardPartialyMetCount,
      standardPartialyMetCountper,
      standardNotMetCount,
      standardNotMetCountper,
    });
  }

  /*
  const users = await db.users.findOne({
    where: {
      id: req.userId,
    },
  });

  //console.log(users);

  var where = `  organization_id=${organization_id}`;
  let scorewhereprop = `updator_score`;
  if (req.role_id === 4) {
    where = where + ` and updator_id=${req.userId}`;
  } else if (req.role_id === 5) {
    // where =
    //   where +
    //   ` and (internal_surveyor_id=${req.userId} or external_surveyor_id=${req.userId})`;
    if (users.surveyor_type == 1) {
      scorewhereprop = "internal_surveyor_score";
      where = where + ` and internal_surveyor_id=${req.userId} `;
    } else {
      scorewhereprop = "external_surveyor_score";
      where = where + ` and  external_surveyor_id=${req.userId}`;
    }
  }

  if (req.body.from_date) {
    where = where + ` AND createdAt >= '${req.body.from_date}'`;
  }
  if (req.body.to_date) {
    where = where + ` AND createdAt <= '${req.body.to_date}'`;
  }

  if (req.body.library_id) {
    where = where + ` AND library_id = '${req.body.library_id}'`;
  }

  let sql = ``;
  /*
  sql = ` select * from score_mapping where updator_id=1474 group by library_id,substanard_id order by substanard_id desc `;

  const scoers = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  }); */

  //console.log(uniqueLibs);

  //const complientMet = await helper.getUpdatorComplientMetScore(scoers);
  /*
  sql = `select 
   
    (select count(distinct(substanard_id)) from score_mapping where ${where} AND ${scorewhereprop} > 0 ) as libraryMetCount,
    (select count(distinct(substanard_id)) from score_mapping where ${where} AND ${scorewhereprop} = 0 ) as libraryNotMetCount,
    (select count(distinct(substanard_id)) from score_mapping where ${where} AND ${scorewhereprop} in (null,-1))  as libraryNACount,
   
    (select count(distinct(chapter_id)) from score_mapping where ${where} AND ${scorewhereprop} > 0) as chapterMetCount,
    (select count(distinct(chapter_id)) from score_mapping where ${where} AND ${scorewhereprop} = 0) as chapterNotMetCount,
    (select count(distinct(chapter_id)) from score_mapping where ${where} AND ${scorewhereprop} in (null,-1)) as chapterNACount,
   
    (select count(distinct(standard_id)) from score_mapping where ${where} AND ${scorewhereprop} > 0)  as standardMetCount,
    (select count(distinct(standard_id)) from score_mapping where ${where} AND ${scorewhereprop} = 0) as standardNotMetCount,
    (select count(distinct(standard_id)) from score_mapping where ${where} AND ${scorewhereprop} in (null,-1)) as standardNACount,
     
    (select count(distinct(substanard_id)) from score_mapping where ${where} AND ${scorewhereprop} > 0)  as substandardMetCount,
    (select count(distinct(substanard_id)) from score_mapping where ${where} AND ${scorewhereprop} = 0) as substandardNotMetCount,
    (select count(distinct(substanard_id)) from score_mapping where ${where} AND ${scorewhereprop} in (null,-1)) as substandardNACount`;

  if (req.body.role) {
    if (req.body.role === "Internalsurveyor") {
      sql = `select 
   
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND internal_surveyor_score > 0 ) as libraryMetCount,
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND internal_surveyor_score = 0 ) as libraryNotMetCount,
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND internal_surveyor_score in (null,-1))  as libraryNACount,
           
        (select count(distinct(chapter_id)) from score_mapping where ${where} AND internal_surveyor_score > 0) as chapterMetCount,
        (select count(distinct(chapter_id)) from score_mapping where ${where} AND internal_surveyor_score = 0) as chapterNotMetCount,
        (select count(distinct(chapter_id)) from score_mapping where ${where} AND internal_surveyor_score in (null,-1)) as chapterNACount,
           
        (select count(distinct(standard_id)) from score_mapping where ${where} AND internal_surveyor_score > 0)  as standardMetCount,
        (select count(distinct(standard_id)) from score_mapping where ${where} AND internal_surveyor_score = 0) as standardNotMetCount,
        (select count(distinct(standard_id)) from score_mapping where ${where} AND internal_surveyor_score in (null,-1)) as standardNACount,
           
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND internal_surveyor_score > 0)  as substandardMetCount,
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND internal_surveyor_score = 0) as substandardNotMetCount,
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND internal_surveyor_score in (null,-1)) as substandardNACount`;
    } else if (req.body.role === "Externalsurveyor") {
      sql = `select 
   
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND external_surveyor_score > 0 ) as libraryMetCount,
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND external_surveyor_score = 0 ) as libraryNotMetCount,
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND external_surveyor_score in (null,-1))  as libraryNACount,
           
        (select count(distinct(chapter_id)) from score_mapping where ${where} AND external_surveyor_score > 0) as chapterMetCount,
        (select count(distinct(chapter_id)) from score_mapping where ${where} AND external_surveyor_score = 0) as chapterNotMetCount,
        (select count(distinct(chapter_id)) from score_mapping where ${where} AND external_surveyor_score in  (null,-1)) as chapterNACount,
           
        (select count(distinct(standard_id)) from score_mapping where ${where} AND external_surveyor_score > 0)  as standardMetCount,
        (select count(distinct(standard_id)) from score_mapping where ${where} AND external_surveyor_score = 0) as standardNotMetCount,
        (select count(distinct(standard_id)) from score_mapping where ${where} AND external_surveyor_score in (null,-1)) as standardNACount,
      
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND external_surveyor_score > 0)  as substandardMetCount,
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND external_surveyor_score = 0) as substandardNotMetCount,
        (select count(distinct(substanard_id)) from score_mapping where ${where} AND external_surveyor_score in (null,-1)) as substandardNACount`;
    }
  }

  console.log(sql);
  await db.sequelize
    .query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    })
    .then((data) => {
      // libraryAssignedCount = data[0].libraryAssignedCount;

      libraryMetCount = data[0].libraryMetCount;
      libraryNotMetCount = data[0].libraryNotMetCount;
      libraryNACount = data[0].libraryNACount;
      libraryAssignedCount =
        libraryMetCount + libraryNotMetCount + libraryNACount;
      libraryMetCountper = 0;
      libraryNotMetCountper = 0;
      libraryNACountper = 0;
      if (libraryAssignedCount > 0) {
        libraryMetCountper = (libraryMetCount / libraryAssignedCount) * 100;
        libraryNotMetCountper =
          (libraryNotMetCount / libraryAssignedCount) * 100;
        libraryNACountper = (libraryNACount / libraryAssignedCount) * 100;
      }

      // chapterAssignedCount = data[0].chapterAssignedCount;

      chapterMetCount = data[0].chapterMetCount;
      chapterNotMetCount = data[0].chapterNotMetCount;
      chapterNACount = data[0].chapterNACount;
      chapterAssignedCount =
        chapterMetCount + chapterNotMetCount + chapterNACount;
      chapterMetCountper = 0;
      chapterNotMetCountper = 0;
      chapterNACountper = 0;
      if (chapterAssignedCount > 0) {
        chapterMetCountper = (chapterMetCount / chapterAssignedCount) * 100;
        chapterNotMetCountper =
          (chapterNotMetCount / chapterAssignedCount) * 100;
        chapterNACountper = (chapterNACount / chapterAssignedCount) * 100;
      }

      // standardAssignedCount = data[0].standardAssignedCount;

      standardMetCount = data[0].standardMetCount;
      standardNotMetCount = data[0].standardNotMetCount;
      standardNACount = data[0].standardNACount;
      standardAssignedCount =
        standardMetCount + standardNotMetCount + standardNACount;
      standardMetCountper = 0;
      standardNotMetCountper = 0;
      standardNACountper = 0;
      if (standardAssignedCount > 0) {
        standardMetCountper = (standardMetCount / standardAssignedCount) * 100;
        standardNotMetCountper =
          (standardNotMetCount / standardAssignedCount) * 100;
        standardNACountper = (standardNACount / standardAssignedCount) * 100;
      }

      // substandardAssignedCount = data[0].substandardAssignedCount;

      substandardMetCount = data[0].substandardMetCount;
      substandardNotMetCount = data[0].substandardNotMetCount;
      substandardNACount = data[0].substandardNACount;
      substandardAssignedCount =
        substandardMetCount + substandardNotMetCount + substandardNACount;
      substandardMetCountper = 0;
      substandardNotMetCountper = 0;
      substandardNACountper = 0;
      if (substandardAssignedCount > 0) {
        substandardMetCountper =
          (substandardMetCount / substandardAssignedCount) * 100;
        substandardNotMetCountper =
          (substandardNotMetCount / substandardAssignedCount) * 100;
        substandardNACountper =
          (substandardNACount / substandardAssignedCount) * 100;
      }

      data[0].libraryMetCountper = libraryMetCountper.toFixed(2);
      data[0].libraryNotMetCountper = libraryNotMetCountper.toFixed(2);
      data[0].libraryNACountper = libraryNACountper.toFixed(2);

      data[0].chapterMetCountper = chapterMetCountper.toFixed(2);
      data[0].chapterNotMetCountper = chapterNotMetCountper.toFixed(2);
      data[0].chapterNACountper = chapterNACountper.toFixed(2);

      data[0].standardMetCountper = standardMetCountper.toFixed(2);
      data[0].standardNotMetCountper = standardNotMetCountper.toFixed(2);
      data[0].standardNACountper = standardNACountper.toFixed(2);

      data[0].substandardMetCountper = substandardMetCountper.toFixed(2);
      data[0].substandardNotMetCountper = substandardNotMetCountper.toFixed(2);
      data[0].substandardNACountper = substandardNACountper.toFixed(2);

      res.send(data);
    })
    .catch((error) => {
      res.send(error);
    }); */
};

exports.UpdatorESRfind = async (req, res) => {
  //console.log(req.body);
  var where = {
    organization_id: req.headers["organization"],
    updator_id: req.userId,
  };

  let fromDate = req.body.from_date;
  let toDate = req.body.to_date;
  let dateFilter = "";

  if (fromDate && fromDate != "" && toDate && toDate != "") {
    dateFilter = ` and date_format(updator_assesment_date,"%Y-%m-%d") between  '${fromDate}' and '${toDate}' `;
  }


  if (req.body.charttype == 1) {


    totalSubStandardCount = await db.sequelize.query(
      `select (select count(distinct(A.substandard_id)) from property_mapping as A left join sub_standards as B on A.substandard_id = B.id 
    where A.user_id=${req.userId} and A.organization_id=${req.organization_id} and A.role_id=4  &&  esr=0 ) as nonesr,
    (select count(distinct(A.substandard_id)) from property_mapping as A left join sub_standards as B on A.substandard_id = B.id 
    where A.user_id=${req.userId} and A.organization_id=${req.organization_id} and A.role_id=4  &&  esr=1 ) as esr `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (totalSubStandardCount.length > 0) {
      console.log(totalSubStandardCount[0]);
      totalsubstandards =
        totalSubStandardCount[0].esr + totalSubStandardCount[0].nonesr;

      if (totalsubstandards > 0) {
        esrPer = (
          (totalSubStandardCount[0].esr / totalsubstandards) *
          100
        ).toFixed(2);
        nonesrPer = (
          (totalSubStandardCount[0].nonesr / totalsubstandards) *
          100
        ).toFixed(2);
      } else {
        esrPer = 0;
        nonesrPer = 0;
      }

      let final = {
        esr: totalSubStandardCount[0].esr,
        nonesr: totalSubStandardCount[0].nonesr,
        esrPer: esrPer,
        nonesrPer: nonesrPer,
      };
      res.send(final);
    } else {
      let final = { esr: 0, nonesr: 0, esrPer: 0, nonesrPer: 0 };
      res.send(final);
    }
  } else if (req.body.charttype == 2) {



    //esr complete and incomplete
    totalSubStandardCount = await db.sequelize.query(
      `select (select count(*) from property_mapping as A  left join  score_mapping as B on A.substandard_id = B.substanard_id && A.organization_id=${req.organization_id} 
      && B.organization_id=${req.organization_id} 
      left join sub_standards as C on A.substandard_id = C.id
      where A.organization_id=${req.organization_id}   && A.role_id=4 && A.user_id=${req.userId} && esr = 1  ${dateFilter} && updator_id is not null) esrcomplete,
      (select count(*) from property_mapping as A  left join  score_mapping as B on A.substandard_id = B.substanard_id && A.organization_id=${req.organization_id}  
      && B.organization_id=${req.organization_id}  ${dateFilter}
      left join sub_standards as C on A.substandard_id = C.id
      where A.organization_id=${req.organization_id}   && A.role_id=4 && A.user_id=${req.userId} && esr = 1  && updator_id is  null  ) esrincomplete `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (totalSubStandardCount.length > 0) {
      //  console.log(totalSubStandardCount[0]);
      totalsubstandards =
        totalSubStandardCount[0].esrcomplete +
        totalSubStandardCount[0].esrincomplete;

      if (totalsubstandards > 0) {
        esrCompletePer = (
          (totalSubStandardCount[0].esrcomplete / totalsubstandards) *
          100
        ).toFixed(2);
        esrInCompletePer = (
          (totalSubStandardCount[0].esrincomplete / totalsubstandards) *
          100
        ).toFixed(2);
      } else {
        esrCompletePer = 0;
        esrInCompletePer = 0;
      }

      let final = {
        esrcomplete: totalSubStandardCount[0].esrcomplete,
        esrincomplete: totalSubStandardCount[0].esrincomplete,
        esrCompletePer: esrCompletePer,
        esrInCompletePer: esrInCompletePer,
      };
      res.send(final);
    } else {
      let final = {
        esrcomplete: 0,
        esrincomplete: 0,
        esrCompletePer: 0,
        esrInCompletePer: 0,
      };
      res.send(final);
    }
  } else {
    //non esr
    totalSubStandardCount = await db.sequelize.query(
      `select (select count(*) from property_mapping as A  left join  score_mapping as B on A.substandard_id = B.substanard_id && A.organization_id=${req.organization_id} 
      && B.organization_id=${req.organization_id} 
      left join sub_standards as C on A.substandard_id = C.id
      where A.organization_id=${req.organization_id}   && A.role_id=4 && A.user_id=${req.userId} && esr = 0 ${dateFilter}  && updator_id is not null) nonesrcomplete,
      (select count(*) from property_mapping as A  left join  score_mapping as B on A.substandard_id = B.substanard_id && A.organization_id=${req.organization_id} 
      && B.organization_id=${req.organization_id}   ${dateFilter} 
      left join sub_standards as C on A.substandard_id = C.id
      where A.organization_id=${req.organization_id}   && A.role_id=4 && A.user_id=${req.userId} && esr = 0  && updator_id is  null) nonesrincomplete `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (totalSubStandardCount.length > 0) {
      console.log(totalSubStandardCount[0]);
      totalsubstandards =
        totalSubStandardCount[0].nonesrcomplete +
        totalSubStandardCount[0].nonesrincomplete;

      if (totalsubstandards > 0) {
        nonesrCompletePer = (
          (totalSubStandardCount[0].nonesrcomplete / totalsubstandards) *
          100
        ).toFixed(2);
        nonesrInCompletePer = (
          (totalSubStandardCount[0].nonesrincomplete / totalsubstandards) *
          100
        ).toFixed(2);
      } else {
        nonesrCompletePer = 0;
        nonesrInCompletePer = 0;
      }

      let final = {
        nonesrcomplete: totalSubStandardCount[0].nonesrcomplete,
        nonesrincomplete: totalSubStandardCount[0].nonesrincomplete,
        nonesrCompletePer: nonesrCompletePer,
        nonesrInCompletePer: nonesrInCompletePer,
      };
      res.send(final);
    } else {
      let final = {
        nonesrcomplete: 0,
        nonesrincomplete: 0,
        nonesrCompletePer: 0,
        nonesrInCompletePer: 0,
      };
      res.send(final);
    }
  }


};

exports.Updatorkpi = async (req, res) => {
  var where = { organization_id: req.headers["organization"], type: 2 };
  if (req.body.from_date) {
    where.createdAt = {
      [Op.gte]: req.body.from_date,
    };
  }
  if (req.body.to_date) {
    where.createdAt = {
      [Op.lte]: req.query.to_date,
    };
  }
  if (req.body.kpi_id) {
    where.id = req.body.kpi_id;
  }
  db.client_admin_activities
    .findAll({
      where: where,
      include: [
        {
          model: db.storage_activity_kpi,
          as: "storejoin",
          where: { updator_id: req.userId },
          //  where:{organization_id: req.headers['organization']},
          include: [{ model: db.storage_activity_kpi_elements, as: "element" }],
        },
      ],
    })
    .then((data) => {
      res.send(data);
    });
};

exports.Updatorobservation = async (req, res) => {
  var monthNameList = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (req.headers["organization"]) {
    var where = { organization_id: req.headers["organization"], type: 2 };
  } else {
    var where = { type: 2 };
  }

  if (req.body.from_date) {
    where.createdAt = {
      [Op.gte]: req.body.from_date,
    };
  }
  if (req.body.to_date) {
    where.createdAt = {
      [Op.lte]: req.query.to_date,
    };
  }
  if (req.body.kpi_id) {
    where.id = req.body.kpi_id;
  }
  db.client_admin_activities
    .findAll({
      where: where,
      include: [
        {
          model: db.storage_observation,
          as: "storeobservationjoin",
          where: { updator_id: req.userId },
          //  where:{organization_id: req.headers['organization']},
          //  include:[
          //    { model: db.storage_activity_kpi_elements, as: 'element',}
          //  ]
        },
      ],
    })
    .then(async (data) => {
      data = [];
      // monthNameList.forEach((month,el) => {
      //   monthData = {month : '0' };
      //   data = {...data,...monthData};
      //    console.log(data);
      //      //data.push(monthData)
      // });

      data = await monthNameList.map((el) => {
        return {
          month: el,
          observation: Math.floor(Math.random() * 100),
        };
      });

      res.send(data);
      // .then(data => {
      //   res.send(data);
      // })
      // data = {
      //   "jan" : '10',
      //   "feb" : "90",
      //   "mar" : "0",
      //   "apr" : "15",
      //   "may" : "16",
      //   "jun" : "17",
      //   "jul" : "0",
      //   "aug" : "0",
      //   "sep" : "0",
      //   "oct" : "0",
      //   "nov" : "0",
      //   "dec" : "0"
      // }
    });
};

exports.UpdatorchecklistScore = async (req, res) => {
  var where = {
    status: { [Op.notIn]: [master.status.delete] },
    organization_id: req.headers["organization"],
    updator_id: req.userId,
  };
  db.storage_activity_checklist
    .findAll({
      group: ["mapping_id"],
      attributes: [
        "id",
        "organization_id",
        "mapping_id",
        "response_frequency",
        "response_date",
        "file_status",
        "status",
        "createdAt",
      ],
      where: where,
      include: [
        {
          model: db.storage_activity_checklist_elements,
          as: "element",
          // attributes:['response']
          attributes: [
            [
              db.sequelize.fn(
                "AVG",
                db.storage_activity_checklist_elements.sequelize.col("response")
              ),
              "response",
            ],
          ],
        },
        {
          model: db.admin_activities,
          as: "adminActivityDetail",
          attributes: ["name", "code"],
        },
        {
          model: db.client_admin_activities,
          as: "clientActivityDetail",
          attributes: ["name", "code"],
        },
      ],
    })
    .then(async (data) => {
      res.send(data);
    });
};

exports.assignedPropertiesCount = async (req, res) => {
  let date = new Date();
  // date.setDate(date.getDate(date) + 1);
  const NOW = helper.dateFormatUSA(date);
  var where = {
    organization_id: req.headers["organization"],
    [Op.or]: {
      user_id: req.userId,
      [Op.and]: {
        assignto: req.userId,
        expirydate: {
          [Op.gte]: NOW,
        },
      },
    },
  };
  try {
    let library_count = await db.property_mapping.findAll({
      where: where,
      group: ["library_id"],
    });

    // let chapter_count = await db.property_mapping.findAll({
    //   where: where,
    //   group: ["chapter_id"],
    // });

    let chapter_count = await db.property_mapping.findAll({
      where: where,
      group: ["chapter_id"],
    });

    let standard_count = await db.property_mapping.findAll({
      where: where,
      group: ["standard_id"],
      logging: true,
    });

    let substandard_count = await db.property_mapping.findAll({
      where: where,
      group: ["substandard_id"],
    });

    var details = {};
    details.chapter_count = chapter_count.length;
    details.library_count = library_count.length;
    details.standard_count = standard_count.length;
    details.substandard_count = substandard_count.length;

    //console.log(details);
    res.send(details);
  } catch (error) {
    res.send(error);
  }
};

exports.taskStatus = async (req, res) => {
  let today = new Date();
  let fromDate =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  let toDate =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  /*
   let org_id = req.organization_id;
   var where = {};

   where = {admin_activity_id: { [Op.ne]: null } };

   let substandardIds = await db.property_mapping
      .findAll({
        where: {
          organization_id: req.organization_id,
          user_id: req.userId
        },
        group: ["substandard_id"],
      })
      .then((data) => {
        return data.map((data) => data.substandard_id);
      });
  
    if (req.role_id == 4) {
      db.sequelize
        .query(
          `select substandard_id from property_mapping where organization_id=${req.organization_id} && role_id=4 
       && assignto=${req.userId} && expirydate >= CURDATE() group by substandard_id`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((tempData) =>
          tempData.map((el) => substandardIds.push(el.substandard_id))
        );
    }

    where.substandard_id = { [Op.in]: substandardIds };

    let admin = await db.activity_mapping.findAll({
      where: {
        organization_id: { [Op.in]: [0, req.organization_id] },
        ...where,
      }, 
      // logging: console.log,
      attributes: ["admin_activities.*", "activity_mapping.admin_activity_id"],
      include: [
        {
          model: db.admin_activities,
          as: "admin_activities",
          where: {
            status: {
              [Op.notIn]: [master.status.delete],
            },
          },
          attributes: [],
          nested: false,
          required: true,
        },
      ],
      group: ["admin_activities.id"],
      raw: true,
    });



    let custom_activities = [];
    for (let index = 0; index < admin.length; index++) {
      custom_activities.push(admin[index].id);
    }

    if (admin.length) {
      var client_activity = await db.activities_organization.findAll({
        where: {
          admin_activity_id: { [Op.in]: [custom_activities] },
          organization_id: req.organization_id,
        },
      });

      admin.map((x) => {
        zz = client_activity.find((y) => {
          return y.admin_activity_id === x.admin_activity_id;
        });
        if (zz) {
          delete zz.dataValues["id"];
          Object.assign(x, zz.dataValues);
        }
      });

      var datacollectionAct = await db.client_admin_datacollections.findAll({
        where: {
          admin_activity_id: { [Op.in]: [custom_activities] },
          organization_id: req.organization_id,
        },
      });

      admin.map((x) => {
        zz = datacollectionAct.find((y) => {
          return y.admin_activity_id === x.admin_activity_id;
        });

        if (zz) {
          delete zz.dataValues["id"];
          Object.assign(x, zz.dataValues);
        }
      });
    }

    clientwhere = { 
      client_activity_id: { [Op.ne]: null },
    };

    clientwhere.substandard_id = { [Op.in]: substandardIds };

    var clientadmin = await db.activity_mapping.findAll({
      where: clientwhere,
      attributes: [
        "client_activities.*",
        "activity_mapping.client_activity_id",
        "activity_mapping.library_id",
      ],
      include: [
        {
          model: db.client_admin_activities,
          as: "client_activities", 
          attributes: [],
          nested: false,
          required: true,
        },
      ],
      group: ["client_activities.id"],
      raw: true,
    });

    let final = clientadmin.concat(admin);

    console.log(final.length); return;
    return ; */

  if (req.role_id == 1) {
    return res.send([]);
  }

  const sql = `select A.*,m.admin_activity_id,m.client_activity_id from activity_mapping m
left join admin_activities as A  on m.admin_activity_id=A.id and m.organization_id in (0,${req.organization_id}) and
m.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} and status=1)   
left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id}   && p.role_id=4 
where p.user_id=${req.userId}   && m.admin_activity_id is not null group by A.id,m.library_id  
`;

  const clientSql = `select A.*,m.admin_activity_id,m.client_activity_id
from activity_mapping m 
left join client_admin_activities as A  on m.client_activity_id=A.id and m.organization_id in (0,${req.organization_id}) and A.organization_id = ${req.organization_id}
left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id} && p.role_id=4
where m.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} and status=1) 
&& p.user_id=${req.userId}  && m.client_activity_id is not null group by A.id,m.library_id
`;

  const adminActivities = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  admin_activity_ids_arr = adminActivities.map(
    (el) => el.admin_activity_id !== null && el.admin_activity_id
  );
  admin_activity_ids_arr = admin_activity_ids_arr.toString();
  admin_activity_ids_temp = admin_activity_ids_arr.split(",");
  let admin_activity_ids_arr_list =
    "'" + admin_activity_ids_temp.join("','") + "'";
  activityOrganization = await db.sequelize.query(
    `select * from activities_organization where organization_id = ${req.organization_id} && admin_activity_id in (${admin_activity_ids_arr_list})`,
    {
      type: db.sequelize.QueryTypes.SELECT,
      raw: true,
    }
  );

  adminActivities.map((x) => {
    zz = activityOrganization.find((y) => {
      return y.admin_activity_id === x.admin_activity_id;
    });
    if (zz) {
      delete zz.id;
      Object.assign(x, zz);
    }
  });

  const clientActivities = await db.sequelize.query(clientSql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  let AllActivity = [...adminActivities, ...clientActivities].map((el) => {
    return {
      id: el.id,
      admin_activity_id: el.admin_activity_id,
      client_activity_id: el.client_activity_id,
      name: el.name,
      response_frequency: el.response_frequency,
      submission_day: el.submission_day,
      type: el.type,
      kpi: el.kpi,
      status: 0,
    };
  });
  // .filter(el=>el.type==1) ;

  let i = 0;
  for (let activity of AllActivity) {
    if (activity) {
      if (
        activity.type == 1 &&
        activity.response_frequency &&
        activity.submission_day
      ) {
        let whereActivity = "";
        let responseHeadList = await helper.getStartAndEndDate(
          fromDate,
          toDate,
          activity.response_frequency,
          activity.submission_day
        );

        if (responseHeadList) {
          whereActivity = ` and response_date between date_format('${responseHeadList.startDate}','%Y-%m-%d') and date_format('${responseHeadList.endDate}','%Y-%m-%d')`;
        }
        if (activity.admin_activity_id) {
          resultAct = await db.sequelize.query(
            `select count(*) as noofresponse from storage_activity_checklist where admin_activity_id = '${activity.admin_activity_id}' && organization_id=${req.headers["organization"]} ${whereActivity}`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
        } else {
          resultAct = await db.sequelize.query(
            `select count(*) as noofresponse from storage_activity_checklist where client_activity_id = '${activity.client_activity_id}' && organization_id=${req.headers["organization"]}  ${whereActivity}`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
        }

        if (resultAct[0].noofresponse > 0 && AllActivity[i]) {
          AllActivity[i].status = 1;
        }
      } else if (
        activity.type == 2 &&
        activity.response_frequency &&
        activity.submission_day
      ) {
        let responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          activity.response_frequency,
          activity.submission_day
        );

        //console.log(responseHeadList);

        if (activity.kpi == 0) {
          let where = "";
          for (const responseHead of responseHeadList) {
            let firstDate = helper.dateFormatUSA(responseHead.responseDate);
            let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);
            where = ` and admin_activity_id='${activity.admin_activity_id}' and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;

            if (activity.client_activity_id) {
              where = ` and client_activity_id=${activity.client_activity_id} and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;
            }

            let storageDetails = await db.sequelize.query(
              `select * from storage_observation where organization_id = ${req.organization_id} ${where} order by responsedate`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            if (storageDetails.length > 0) {
              AllActivity[i].status = 1;
            }
          }
        } else {
          for (const responseHead of responseHeadList) {
            let firstDate = helper.dateFormatUSA(responseHead.responseDate);
            let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);
            let actCond = ` B.client_activity_id = '${activity.client_activity_id}' `;
            if (activity.admin_activity_id) {
              actCond = ` B.admin_activity_id = '${activity.admin_activity_id}' `;
            }

            actCond =
              actCond +
              ` and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d') `;

            let scoreList = await db.sequelize.query(
              `select * from storage_activity_kpi_elements as A left join storage_activity_kpi as B
            on A.storage_id = B.id where  ${actCond} and organization_id=${req.organization_id}   `,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            if (scoreList.length > 0) {
              AllActivity[i].status = 1;
            }
          }
        }
      } else if (
        activity.type == 3 &&
        activity.response_frequency &&
        activity.submission_day
      ) {
        let responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          activity.response_frequency,
          activity.submission_day
        );
        let where = "";
        for (const responseHead of responseHeadList) {
          let firstDate = helper.dateFormatUSA(responseHead.responseDate);
          let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);
          where = ` and admin_activity_id='${activity.admin_activity_id}' and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;

          if (activity.client_activity_id) {
            where = ` and client_activity_id=${activity.client_activity_id} and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;
          }

          let storage_activity_documents = await db.sequelize.query(
            `select *,(select name from users where id=storage_activity_document.updator_id) as updatorname from storage_activity_document where organization_id = ${req.organization_id} ${where} limit 1`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          if (storage_activity_documents.length) {
            AllActivity[i].status = 1;
          }
        }
      }
    }
    i++;
  }

  // AllActivity = AllActivity.filter(el=>el.type==1);

  // console.log(AllActivity);

  // return res.send(AllActivity);

  const pendingActCount = AllActivity.filter(
    (el) => el.id && el.status == 0
  ).length;
  const completedActCount = AllActivity.filter(
    (el) => el.id && el.status == 1
  ).length;

  let task = {};
  task.pendingTask = pendingActCount;
  task.completedTask = completedActCount;
  res.send(task);
  /*
  let AdminActivitySqlCompleted = `select count(distinct(A.id))  from admin_activities as A left join activity_mapping as B on A.id = B.admin_activity_id where A.id in 
  (select admin_activity_id from storage_activity_checklist where organization_id=${req.organization_id} && admin_activity_id in   
    (  select AM.admin_activity_id from property_mapping as PM inner join activity_mapping as AM on AM.substandard_id=PM.substandard_id && PM.user_id=${req.userId} && AM.organization_id in (0,${req.organization_id}) 
where PM.status is NULL   group by AM.admin_activity_id )  && admin_activity_id is not null
  union  select admin_activity_id from storage_activity_document where organization_id=${req.organization_id} &&   admin_activity_id in  
  (   select AM.admin_activity_id from property_mapping as PM inner join activity_mapping as AM on AM.substandard_id=PM.substandard_id && PM.user_id=${req.userId} && AM.organization_id in (0,${req.organization_id}) 
where PM.status is NULL   group by AM.admin_activity_id )  && admin_activity_id is not null 
  union select admin_activity_id from storage_activity_kpi where organization_id=${req.organization_id} &&   admin_activity_id in  
  (  select AM.admin_activity_id from property_mapping as PM inner join activity_mapping as AM on AM.substandard_id=PM.substandard_id && PM.user_id=${req.userId} && AM.organization_id in (0,${req.organization_id}) 
where PM.status is NULL   group by AM.admin_activity_id )  
  && admin_activity_id is not null 
  union select admin_activity_id from storage_observation where organization_id=${req.organization_id} &&  admin_activity_id in 
  (select AM.admin_activity_id from property_mapping as PM inner join activity_mapping as AM on AM.substandard_id=PM.substandard_id && PM.user_id=${req.userId} && AM.organization_id in (0,${req.organization_id}) 
 where PM.status is NULL   group by AM.admin_activity_id )
  && admin_activity_id is not null )`;
 

  let clientActivitySqlCompleted = `  select  count(distinct(A.id)) from client_admin_activities as A left join activity_mapping as B on A.id = B.client_activity_id where A.id in 
  ( select client_activity_id from storage_activity_checklist where organization_id=${req.organization_id} && client_activity_id in   (  select AM.client_activity_id from property_mapping as PM inner join activity_mapping as AM on AM.substandard_id=PM.substandard_id && PM.user_id=${req.userId} && AM.organization_id in (0,${req.organization_id}) 
where PM.status is NULL   group by AM.client_activity_id )  &&  client_activity_id is not null
  union select client_activity_id from storage_activity_document where organization_id=${req.organization_id} && client_activity_id in   (  select AM.client_activity_id from property_mapping as PM inner join activity_mapping as AM on AM.substandard_id=PM.substandard_id && PM.user_id=${req.userId} && AM.organization_id in (0,${req.organization_id}) 
where PM.status is NULL   group by AM.client_activity_id )  && client_activity_id is not null 
  union select client_activity_id from storage_activity_kpi where organization_id=${req.organization_id} && client_activity_id in   (  select AM.client_activity_id from property_mapping as PM inner join activity_mapping as AM on AM.substandard_id=PM.substandard_id && PM.user_id=${req.userId} && AM.organization_id in (0,${req.organization_id}) 
where PM.status is NULL   group by AM.client_activity_id )  && client_activity_id is not null 
  union select client_activity_id from storage_observation where organization_id=${req.organization_id} && client_activity_id in   (  select AM.client_activity_id from property_mapping as PM inner join activity_mapping as AM on AM.substandard_id=PM.substandard_id && PM.user_id=${req.userId} && AM.organization_id in (0,${req.organization_id}) 
where PM.status is NULL   group by AM.client_activity_id )  && client_activity_id is not null )  `;

  let totalActivitySqlClient = `select count(distinct(A.id)) as totalAssignedActivityClient  from client_admin_activities as A left join activity_mapping as B on A.id = B.client_activity_id 
  where B.substandard_id in (select substandard_id from property_mapping where role_id=4 && user_id=${req.userId} && organization_id=${req.organization_id})  && A.organization_id=${req.organization_id}
   `;
 

  let totalActivitySql = `select count(distinct(A.id)) as totalAssignedActivity,(${totalActivitySqlClient}) as totalClientActivity,(${AdminActivitySqlCompleted}) as adminActivityTaskComp,
  (${clientActivitySqlCompleted}) as clientActivityTaskComp from admin_activities as A left join activity_mapping as B on A.id = B.admin_activity_id  and B.organization_id in (0,${req.organization_id}) 
  where B.substandard_id in (select substandard_id from property_mapping where role_id=4 && user_id=${req.userId} && organization_id=${req.organization_id}) 
   `;
 
  db.sequelize
    .query(totalActivitySql, {
      type: db.sequelize.QueryTypes.SELECT,
    })
    .then((result) => {
      let task = {};
      if (result.length > 0) {
        console.log(
          +result[0].adminActivityTaskComp,
          +result[0].clientActivityTaskComp
        );

        task.pendingTask =
          +result[0].totalAssignedActivity +
          +result[0].totalClientActivity -
          +result[0].adminActivityTaskComp -
          +result[0].clientActivityTaskComp;

        task.completedTask =
          +result[0].adminActivityTaskComp + +result[0].clientActivityTaskComp;
      } else {
        task.pendingTask = 0;
        task.completedTask = 0;
      }
      res.send(task);
    })
    .catch((error) => {
      console.log(error);
      res.send("Something Went Wrong");
    }); */
};

exports.UpdatorCount = async (req, res) => {
  const assignedLib = await db.property_mapping.findAll({
    where: {
      organization_id: req.organization_id,
      user_id: req.userId,
      role_id: 4,
    },
    group: ["library_id"],
  });

  let libScores = [];
  let chapterScores = [];
  let standardScores = [];

  for (const element of assignedLib) {
    let updatorLibraryScore = await helper.getLibraryScoreUpdatorSurveyorComp(
      req,
      element.library_id,
      req.userId,
      0
    );

    libScores.push(+updatorLibraryScore);

    let updatorStandardScore = await helper.getStandardScoreUpdatorSurv(
      req,
      element.library_id,
      req.userId,
      0,
      null,
      null,
      null
    );

    standardScores.push(+updatorStandardScore);

    let updatorChapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      element.library_id,
      req.userId,
      0,
      null,
      null,
      null
    );

    chapterScores.push(+updatorChapterScore);
  }

  const finalLibScore = libScores.reduce((a, b) => a + b, 0);
  const finalchapterScores = chapterScores.reduce((a, b) => a + b, 0);
  const finalstandardScores = standardScores.reduce((a, b) => a + b, 0);

  let sql = ``;
  sql = `select 
   (select count(distinct(library_id)) from score_mapping where YEAR(createdAt) = YEAR(CURDATE()) AND updator_id=${req.userId}  AND updator_score > 0 ) as libraryMetCount,
    (select count(distinct(library_id)) from score_mapping where YEAR(createdAt) = YEAR(CURDATE()) AND updator_id=${req.userId}  AND updator_score = 0 ) as libraryNotMetCount,

    (select count(distinct(chapter_id)) from score_mapping where YEAR(createdAt) = YEAR(CURDATE()) AND updator_id=${req.userId} AND updator_score > 0) as chapterMetCount,
    (select count(distinct(chapter_id)) from score_mapping where YEAR(createdAt) = YEAR(CURDATE()) AND updator_id=${req.userId}  AND updator_score = 0) as chapterNotMetCount,

   
    (select count(distinct(standard_id)) from score_mapping where YEAR(createdAt) = YEAR(CURDATE()) AND updator_id=${req.userId} AND updator_score > 0)  as standardMetCount,
    (select count(distinct(standard_id)) from score_mapping where YEAR(createdAt) = YEAR(CURDATE()) AND updator_id=${req.userId} AND updator_score = 0) as standardNotMetCount,

    (select count(distinct(substanard_id)) from score_mapping where updator_id=${req.userId} AND YEAR(createdAt) = YEAR(CURDATE()))  as substandardFillCount,
    
    (select count(distinct(substandard_id)) from property_mapping where user_id=${req.userId}) as TotalSubstandardsCount`;

  await db.sequelize
    .query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    })
    .then((data) => {
      // libraryMetCount = data[0].libraryMetCount;
      // libraryNotMetCount = data[0].libraryNotMetCount;
      // libraryAssignedCount = libraryMetCount + libraryNotMetCount;
      // OverallScore = 0;

      // if (libraryAssignedCount > 0) {
      //   OverallScore = (libraryMetCount / libraryAssignedCount) * 100;
      // }

      // chapterMetCount = data[0].chapterMetCount;
      // chapterNotMetCount = data[0].chapterNotMetCount;
      // chapterAssignedCount = chapterMetCount + chapterNotMetCount;
      // ChapterScore = 0;
      // if (chapterAssignedCount > 0) {
      //   ChapterScore = (chapterMetCount / chapterAssignedCount) * 100;
      // }

      // standardMetCount = data[0].standardMetCount;
      // standardNotMetCount = data[0].standardNotMetCount;
      // standardAssignedCount = standardMetCount + standardNotMetCount;
      // StandardScore = 0;

      // if (standardAssignedCount > 0) {
      //   StandardScore = (standardMetCount / standardAssignedCount) * 100;
      // }

      var details = {};
      // details.overall_score = OverallScore.toFixed(0);
      // details.chapter_score = ChapterScore.toFixed(0);
      // details.standard_score = StandardScore.toFixed(0);

      // if (isNaN(updatorLibraryScore)) {
      //   updatorLibraryScore = null;
      // }

      details.overall_score = finalLibScore.toFixed(0);
      details.chapter_score = finalchapterScores.toFixed(0);
      details.standard_score = finalstandardScores.toFixed(0);

      if (data[0].TotalSubstandardsCount > 0) {
        task_completed = data[0].substandardFillCount;

        task_pending =
          data[0].TotalSubstandardsCount - data[0].substandardFillCount;
      } else {
        task_completed = 0;
        task_pending = 0;
      }
      details.task_completed = task_completed;

      details.task_pending = task_pending;
      res.send(details);
    })
    .catch((error) => {
      res.send(error);
    });
};
