const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const { dateFormatUSA } = require("../util/helper");
const helper = require("../util/helper");
const crypto = require("crypto");
exports.getMyNofication = async (req, res) => {
  // console.log(req);

  let notifications = [];
  if (req.role_id == 1) {
    const licenseExpiry = await db.sequelize.query(
      `select * from organizations where parent_id is null && valid_to between curdate() and date_add(curdate(), interval 30 day)`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    for (const element of licenseExpiry) {
      if(element.valid_to) {
        notifications.push({
          id: Date.now() + "_" + Math.floor(Math.random() * 100),
          message:
            `${element.name} is going to expire on ` +
            dateFormatUSA(element.valid_to) +
            " .",
          organization_id: element.id,
          redirect_to: `/ss/users`,
        });

      }
 
    }

    res.send(notifications);
  } else if (req.role_id == 2 || req.role_id == 3) {
    const licenseExpiry = await db.sequelize.query(
      `select * from organizations where id=${req.organization_id} && valid_to between curdate() and date_add(curdate(), interval 15 day)`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    for (const element of licenseExpiry) {
      if(element.valid_to) {
        notifications.push({
          id: Date.now() + "_" + Math.floor(Math.random() * 100),
          message:
            `${element.name} is going to expire on ` +
            dateFormatUSA(element.valid_to) +
            " .",
          organization_id: element.id,
          redirect_to: ``,
        });

       }
    
    }

    db.notifications
      .findAll({
        where: {
          user_id: req.userId,
        },
      })
      .then((data) => {
        if (data.length > 0) {
          notifications.push(...data);
        }
        res.send(notifications);
      })
      .catch((error) => {
        console.log(error);
        res.send(error);
      });
  } else if (req.role_id == 4) {
    let activityList = await helper.getUpdatorAssignedActivity(req);
    for (const element of activityList) {
    
      if(element.upcomingExporyDate) {
        notifications.push({
          id: Date.now() + "_" + Math.floor(Math.random() * 100),
          message:
            `${element.activity} Activity is going to expire on ` +
            dateFormatUSA(element.upcomingExporyDate) +
            " .",
          organization_id: element.id,
          redirect_to: `/ss/accreditation`,
        });
      }
    
    } 
    db.notifications
      .findAll({
        where: {
          user_id: req.userId,
        },
      })
      .then((data) => {
        notifications.push(...data);
        //console.log(data);
        res.send(notifications);
      })
      .catch((error) => {
        console.log(error);
        res.send(error);
      });
  } else if (req.role_id == 5) {
    let today = new Date();
    let fromDate =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
    fromDate = helper.dateFormatUSA(fromDate);
    let toDate = today.setDate(today.getDate() + 7);
    toDate = helper.dateFormatUSA(toDate);

    let data = await db.sequelize.query(
      `select A.*,B.surveyor_type from surveyor_session as A left join users as B on A.user_id = B.id
    where A.user_id=${req.userId} && A.to_date between '${fromDate}' and '${toDate}' && A.status=1`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (data && data.length > 0) {
      //  console.log(data.length);
      for (let index = 0; index < data.length; index++) {
        let survey_status = 1;
        let statusCond =
          "ROUND(avg(IFNULL(external_surveyor_score,null)/2)*100) as  surveyor_score ";

        if (data[index].surveyor_type == 1) {
          statusCond =
            "ROUND(avg(IFNULL(internal_surveyor_score,null)/2)*100) as surveyor_score";
        }

        const substandardScores = await db.sequelize.query(
          `select sub.id,sub.name,sub.code,sub.description,${statusCond}
         from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id
         LEFT JOIN score_mapping score on sub.id = score.substanard_id and
         score.organization_id=${req.organization_id}
         where pm.user_id=${req.userId} and pm.organization_id=${req.organization_id} and sub.status not in (2) and pm.library_id=${data[index].library_id}  and sub.session_class_id like '%${data[index].class_id}%'       
         group by sub.id`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        for (const element of substandardScores) {
          if (!element.surveyor_score) {
            survey_status = 0;
          }
        }

        data[index].status = survey_status;
        if (survey_status == 0) {
          notifications.push({
            id: Date.now() + "_" + Math.floor(Math.random() * 100),
            message:
              `${data[index].name} Session is going to expire on ` +
              helper.dateFormatIndia(data[index].to_date) +
              " .",
            organization_id: data[index].id,
            redirect_to: `/ss/Surveys`,
          });
        }
      }
    }

    db.notifications
      .findAll({
        where: {
          user_id: req.userId,
        },
      })
      .then((data) => {
        // console.log(data);
        // res.send(data);
        notifications.push(...data);
        res.send(notifications);
      })
      .catch((error) => {
        console.log(error);
        res.send(error);
      });
  } else if (req.role_id == 6) {
    db.notifications
      .findAll({
        where: {
          user_id: req.userId,
        },
      })
      .then((data) => {
        console.log(data);
        res.send(data);
      })
      .catch((error) => {
        console.log(error);
        res.send(error);
      });
  } else {
    db.notifications
      .findAll({
        // where: {
        //   user_id: req.userId,
        // },
      })
      .then((data) => {
        console.log(data);
        res.send(data);
      })
      .catch((error) => {
        console.log(error);
        res.send(error);
      });
  }
};

exports.update = (req, res) => {
  db.notifications.update(
    { read: 1 },
    {
      where: {
        id: req.id,
      },
    }
  );
};

exports.updateAll = async (req, res) => {

data = {};

 /*
 
  let substandardList = await db.sub_standards
    .findAll({   
      // offset: 30000, 
      // limit: 10000 
    });
 
     
    for (const element of substandardList) {
      let substandard_uid =  crypto.createHash("sha256").update(element.description).digest("hex");

      await db.sub_standards.update({
        substandard_uid : substandard_uid
      },{
        where : {
          id : element.id
        }
      })      
    }

      return  res.send("1st done");
 */

 /*
let substandardList = await db.sequelize.query(`select * from activity_elements where  substandard_id is not null  `,{
  type : db.sequelize.QueryTypes.SELECT
});

// console.log(substandardList); return;

for (const element of substandardList) {
  let substandard_uid =  crypto.createHash("sha256").update(element.substandard_id.trim()).digest("hex");
  await db.sequelize.query(`update activity_elements set substandard_id='${substandard_uid}' where id='${element.id}'` );
 } 

 return  res.send("2nd done");
 
*/
 /*
 
let substandardList = await db.sequelize.query(`select * from activity_elements where   substandard_id is not null group by substandard_id`,{
  type : db.sequelize.QueryTypes.SELECT
});

let array = [];
for (const element of substandardList) {
  await db.sequelize.query(`select *   from activity_elements where  substandard_id='${element.substandard_id}' limit 1,10000`,{
    type : db.sequelize.QueryTypes.SELECT
  }).then(res=>  array.push(...res));
  
}
 
 // console.log(array.length); 
 

 let element_id = array.map(el=>el.id); 
 console.log(element_id);
 await db.activity_elements.destroy({
    where : {
      id : {
        [Op.in] : element_id
      }
    }

    // , logging : true
 })

  */

res.send("all done");
};

/*


exports.create = async (req, res) => {
  try {
    db.countries
      .create({
        country: req.body.country,
        country_code: req.body.country_code,
        international_dialing: req.body.international_dialing,
      })
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "countries",
          primary_id: data.id,
          event: "create",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send(data);
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
 
*/
