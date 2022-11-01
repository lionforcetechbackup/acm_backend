const express = require("express");
const db = require("../models");
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const master = require("../config/default.json");
const { where, NUMBER } = require("sequelize");
const helper = require("../util/helper")

exports.libraryget = async (req, res) => {
  var library = req.body.libraryIds;

  //  let sql = `SELECT libraries.* FROM libraries INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id INNER JOIN property_mapping ON organization_libraries.library_id=property_mapping.library_id WHERE property_mapping.organization_id=${req.organization_id} AND property_mapping.user_id=${req.userId} AND organization_libraries.status=${master.status.active} AND organization_libraries.archive=0 AND libraries.status=${master.status.active}`;

  let sql = `SELECT libraries.* FROM libraries INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id INNER JOIN property_mapping ON organization_libraries.library_id=property_mapping.library_id WHERE property_mapping.organization_id=${req.organization_id} AND  (property_mapping.user_id=${req.userId} or (property_mapping.assignto=${req.userId} && expirydate >= CURDATE())) AND organization_libraries.status=${master.status.active} AND organization_libraries.archive=0 AND libraries.status=${master.status.active}`;

  if (library.length > 0) {
    sql = sql + ` AND libraries.id IN (${library})`;
  }
  sql =
    sql + ` GROUP BY property_mapping.library_id ORDER BY libraries.id DESC`;

  console.log(sql);
  db.sequelize
    .query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    })
    .then((data) => {
      res.send(data);
    });
};
exports.chapterget = async (req, res) => {
  var library = req.body.libraryIds;
  var chapter = req.body.chapterIds;

  // let sql = `SELECT chapters.* FROM chapters as chapters INNER JOIN property_mapping as prop  ON chapters.id = prop.chapter_id and prop.organization_id= ${req.organization_id} and prop.user_id=${req.userId}  WHERE 1=1 `;
  let sql = `SELECT chapters.* FROM chapters as chapters INNER JOIN property_mapping as prop  ON chapters.id = prop.chapter_id and prop.organization_id= ${req.organization_id} and (prop.user_id=${req.userId} || (prop.assignto=${req.userId}  && expirydate >= curdate())) WHERE 1=1 `;

  if (library.length > 0) {
    sql = sql + ` and chapters.library_id IN (${library})`;
  } else if (chapter.length > 0) {
    if (chapter.includes(",")) {
      temp = chapter.split(",");
      chapterquoted = "'" + temp.join("','") + "'";
    } else {
      chapterquoted = `'${chapter}'`;
    }

    sql = sql + ` and chapters.id IN (${chapterquoted})`;
  }
  sql = sql + ` GROUP BY chapters.id ORDER BY chapters.name`;

  //console.log(sql);
  try {
    db.sequelize
      .query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then((data) => {
        res.send(data);
      });
  } catch (error) {
    res.send(error);
  }
};
exports.standardget = async (req, res) => {
  var library = req.body.libraryIds;
  var chapter = req.body.chapterIds;
  var standard = req.body.standardIds;
  let sql = `SELECT standards.* FROM standards standards INNER JOIN property_mapping prop  ON standards.id = prop.standard_id and prop.organization_id= ${req.organization_id} and (prop.user_id=${req.userId}  || (prop.assignto=${req.userId} && expirydate >=  CURDATE()))  LEFT JOIN users usr ON prop.user_id = usr.id INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE 1=1 `;
  
  if (library && library[0] != "" && library.length > 0) {
    sql = sql + ` and chapters.library_id IN (${library})`;
  }

  if (chapter && chapter[0] != "" && chapter.length > 0) {
    chapter = chapter.toString();
    chaptertemp = chapter.split(",");
    var chapterList = "'" + chaptertemp.join("','") + "'";

    sql = sql + ` and standards.chapter_id IN (${chapterList})`;
  }

  if (standard && standard[0] != "" && standard.length > 0) {
    standard = standard.toString();
    standardtemp = standard.split(",");
    var standardList = "'" + standardtemp.join("','") + "'";

    sql = sql + ` and standards.id IN (${standardList})`;
  }

 
  sql = sql + ` group by standards.id ORDER BY standards.name `;
 
  try {
    db.sequelize
      .query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then((data) => {

        data = data.map((el) => ({
          ...el,
          sortItem: el.name,
        }));
        data = helper.sortAlphanumeric(data);
        
        res.send(data);
      });
  } catch (error) {
    res.send(error);
  }
};

exports.substandardget = async (req, res) => {
  var library = req.body.libraryIds;
  var chapter = req.body.chapterIds;
  var standard = req.body.standardIds;
  var sub_standard = req.body.substandardIds;

  /*let sql = `SELECT sub_standards.*,libraries.id as lib
                        FROM property_mapping
                        INNER JOIN sub_standards ON property_mapping.substandard_id=sub_standards.id
                        INNER JOIN standards ON sub_standards.standard_id=standards.id
                        INNER JOIN chapters ON standards.chapter_id=chapters.id 
                        INNER JOIN libraries ON chapters.library_id=libraries.id 
                        INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id
                        WHERE property_mapping.organization_id=${req.organization_id} AND 
                              property_mapping.user_id=${req.userId} AND 
                              organization_libraries.status=${master.status.active} AND 
                              organization_libraries.archive=0 AND libraries.status=${master.status.active} AND 
                              sub_standards.status=${master.status.active} AND 
                              chapters.status=${master.status.active} AND
                              standards.status=${master.status.active}
                              GROUP BY property_mapping.substandard_id`;
*/

  let unitfocusarea = ` (select name from unit_focus_areas where id=sub_standards.unit_focus_area) as unitfocusarea `;
  let sql = `SELECT sub_standards.*,${unitfocusarea} FROM sub_standards  INNER JOIN property_mapping prop  ON sub_standards.id = prop.substandard_id and prop.organization_id=${req.organization_id} AND  (prop.user_id=${req.userId}  or (prop.assignto=${req.userId} && prop.expirydate >= CURDATE())) INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE  1=1 `;

  // if (library && library[0] != "" && library.length > 0) {
  //   sql = `SELECT sub_standards.*,${unitfocusarea} FROM sub_standards  INNER JOIN property_mapping prop  ON sub_standards.id = prop.substandard_id and prop.organization_id=${req.organization_id} AND  prop.user_id=${req.userId} INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE chapters.library_id IN (${library})`;
  // } else if (chapter && chapter[0] != "" && chapter.length > 0) {
  //   sql = `SELECT sub_standards.*,${unitfocusarea} FROM sub_standards INNER JOIN property_mapping prop  ON sub_standards.id = prop.substandard_id and prop.organization_id=${req.organization_id}  AND  prop.user_id=${req.userId}  INNER JOIN standards ON sub_standards.standard_id=standards.id WHERE standards.chapter_id IN (${chapter})`;
  // } else if (standard && standard[0] != "" && standard.length > 0) {
  //   sql = `SELECT sub_standards.*,${unitfocusarea} FROM sub_standards INNER JOIN property_mapping prop  ON sub_standards.id = prop.substandard_id and prop.organization_id=${req.organization_id}  AND  prop.user_id=${req.userId}   WHERE sub_standards.standard_id IN (${standard})`;
  // } else {
  //   let empty = [];
  //   return res.send(empty);
  // }
  // sql = sql + ` group by sub_standards.id  ORDER BY sub_standards.id DESC`;
  if (library && library[0] != "" && library.length > 0) {
    sql = sql + ` and chapters.library_id IN (${library})`;
  }
  if (chapter && chapter[0] != "" && chapter.length > 0) {
    chapter = chapter.toString();
    chaptertemp = chapter.split(",");
    var chapterList = "'" + chaptertemp.join("','") + "'";

    sql = sql + ` and standards.chapter_id IN (${chapterList})`;
  }
  if (standard && standard[0] != "" && standard.length > 0) {
    standard = standard.toString();
    standardtemp = standard.split(",");
    var standardList = "'" + standardtemp.join("','") + "'";

    sql = sql + ` and standards.id IN (${standardList})`;
  }

  if (sub_standard && sub_standard[0] != "" && sub_standard.length > 0) {
    sub_standard = sub_standard.toString();
    sub_standardtemp = sub_standard.split(",");
    var sub_standardList = "'" + sub_standardtemp.join("','") + "'";

    sql = sql + ` and sub_standards.id IN (${sub_standardList})`;
  }

  sql = sql + ` group by sub_standards.id  ORDER BY sub_standards.name`;

  //console.log(sql);

  try {
    db.sequelize
      .query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then((data) => {
        //sorting function
        data = data.map((el) => ({
          ...el,
          sortItem: el.name,
        }));
        data = helper.sortAlphanumeric(data);
        res.send(data);
      });

  } catch (error) {
    res.send(error);
  }
};

exports.activityget = async (req, res) => {
  var library = req.body.libraryIds;
  var chapter = req.body.chapterIds;
  var standard = req.body.standardIds;
  var sub_standard = req.body.substandardIds;
  // var sub_standard =req.body.substandardIds;

  /*
    old code overwrite for activity filter in updator
  
  */

  if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
    //this part using for activity filter
    var activities = [];
    let adminActivitySql = `
    select A.* from admin_activities as A left join activity_mapping as B on A.id = B.admin_activity_id 
  where B.substandard_id in (select substandard_id from property_mapping where role_id=4 && user_id=${req.userId} && organization_id=${req.organization_id})   group by A.id
    `;

    let clientActivitySql = `
    select A.* from client_admin_activities as A left join activity_mapping as B on A.id = B.client_activity_id
    where B.substandard_id in (select substandard_id from property_mapping where role_id=${req.role_id} && user_id=${req.userId} && organization_id=${req.organization_id}) && A.organization_id=${req.organization_id} group by A.id
    `;

    adminActivity = await db.sequelize.query(adminActivitySql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    clientActivity = await db.sequelize.query(clientActivitySql, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    if (adminActivity && clientActivity) {
      activities = [...adminActivity, ...clientActivity];
    }

    return res.send(activities);
  } else {
    let sql = `SELECT sub_standards.*,libraries.id as lib
    FROM property_mapping
    INNER JOIN sub_standards ON property_mapping.substandard_id=sub_standards.id
    INNER JOIN standards ON sub_standards.standard_id=standards.id
    INNER JOIN chapters ON standards.chapter_id=chapters.id 
    INNER JOIN libraries ON chapters.library_id=libraries.id 
    INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id
    WHERE property_mapping.organization_id=${req.organization_id} AND 
          property_mapping.user_id=${req.userId} AND 
          organization_libraries.status=${master.status.active} AND 
          organization_libraries.archive=0 AND libraries.status=${master.status.active} AND 
          sub_standards.status=${master.status.active} AND 
          chapters.status=${master.status.active} AND
          standards.status=${master.status.active}
          GROUP BY property_mapping.substandard_id`;

    if (library && library[0] != "" && library.length > 0) {
      sql = sql + ` AND chapters.library_id IN (${library})`;
    }
    if (chapter && chapter[0] != "" && chapter.length > 0) {
      sql = sql + ` AND standards.chapter_id IN (${chapter})`;
    }
    if (standard && standard[0] != "" && standard.length > 0) {
      sql = sql + ` AND standards.id IN (${standard})`;
    }
    if (sub_standard && sub_standard[0] != "" && sub_standard.length > 0) {
      sql = sql + ` AND sub_standards.id IN (${sub_standard})`;
    }
    sql = sql + ` ORDER BY sub_standards.id DESC`;
    try {
      db.sequelize
        .query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        })
        .then((data) => {
          res.send(data);
        });
    } catch (error) {
      res.send(error);
    }
  }
};

exports.activity = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  var where = {};
  var propWhere = {};
  let activity_id = null;
  if (req.query.type == "library") {
    where = { library_id: req.query.id, admin_activity_id: { [Op.ne]: null } };
  } else if (req.query.type == "standard") {
    where = { standard_id: req.query.id, admin_activity_id: { [Op.ne]: null } };
  } else if (req.query.type == "substandard") {
    where = {
      substandard_id: req.query.id,
      admin_activity_id: { [Op.ne]: null },
    };

    propWhere = {
      substandard_id: req.query.id,
    };
  } else if (req.query.type == "chapter") {
    where = { chapter_id: req.query.id, admin_activity_id: { [Op.ne]: null } };
  } else if (req.query.type == "activity") {
    activity_id = req.query.id;
  }

  if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
    parentOrgId = await db.organizations
      .findAll({
        where: {
          parent_id: req.organization_id,
        },
      })
      .then((data) => {
        return data.map((data) => data.id);
      });
  }



  let substandardIds = await db.property_mapping
    .findAll({
      where: {
        organization_id: req.organization_id,
        user_id: req.userId,
        ...propWhere,
      },
      group: ["substandard_id"],
    })
    .then((data) => {
      return data.map((data) => data.substandard_id);
    }); 
    
    // console.log(substandardIds.length);

  if (req.role_id == 4) {
 
    await db.sequelize
      .query(
        `select substandard_id from property_mapping where organization_id=${req.organization_id} && role_id=4 
     && assignto=${req.userId} && expirydate >= CURDATE() group by substandard_id`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then((tempData) =>
    {
      // console.log(tempData.length);
      tempData.map((el) => substandardIds.push(el.substandard_id))
    }
      );
  }

  
  if (substandardIds.length > 0) {
    if (req.query.type == "substandard") {
      substandardIds.push(req.query.id);
    }
    where.substandard_id = { [Op.in]: substandardIds };

    if (activity_id) {
      where.admin_activity_id = activity_id;
    }

   let activitySessionMppingIds = [];
    if(req.role_id==5) {
        activitySessionMppingIds = await db.sequelize.query(`select admin_activity_id,client_activity_id from activity_session_mapping where session_class_id in (select class_id from surveyor_session where user_id=1305 and status=1) 
      and  (organization_id is null or organization_id=${req.organization_id}) && status=1  group by  admin_activity_id,client_activity_id`,{
        type : db.sequelize.QueryTypes.SELECT
      }
      ) ;

       if(activitySessionMppingIds.length > 0) {

        activitySessionMppingIds =  activitySessionMppingIds.map(el=>el.admin_activity_id).filter(el=>el !=null);
        if(activitySessionMppingIds.length > 0) {
          where.admin_activity_id = {
            [Op.in] : activitySessionMppingIds
          }
        }
      
       }
    } 
 
    let admin = await db.activity_mapping.findAll({
      where: {
        organization_id: { [Op.in]: [0, req.organization_id] },
        ...where,
        
      }, 
      // logging : true,
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
      logging: true
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

    propsClientWhere = {};
    if (req.query.type == "library") {
      clientwhere = {
        library_id: req.query.id,
        client_activity_id: { [Op.ne]: null },
      };
    } else if (req.query.type == "standard") {
      clientwhere = {
        standard_id: req.query.id,
        client_activity_id: { [Op.ne]: null },
      };
    } else if (req.query.type == "substandard") {
      clientwhere = {
        substandard_id: req.query.id,
        client_activity_id: { [Op.ne]: null },
        organization_id: req.organization_id,
      };
      propsClientWhere = {
        substandard_id: req.query.id,
      };
    } else if (req.query.type == "chapter") {
      clientwhere = {
        chapter_id: req.query.id,
        client_activity_id: { [Op.ne]: null },
      };
    } else {
      clientwhere = {};
    }
    clientwhere.substandard_id = { [Op.in]: substandardIds };
    //console.log(substandardIds);
    if (parentOrgId) {
      clientwhere.organization_id = { [Op.in]: [org_id] };
    } else clientwhere.organization_id = { [Op.in]: [org_id, 0] };

    if (activity_id) {
      clientwhere.client_activity_id = activity_id;
    }

    if(req.role_id==5) {

      if(activitySessionMppingIds.length > 0) {
        activitySessionMppingIds = activitySessionMppingIds.map(el=>el.client_activity_id).filter(el=>el != null);
        if(activitySessionMppingIds.length > 0) {
          clientwhere.client_activity_id = {
            [Op.in] : activitySessionMppingIds
          }
        }
       
       }

    }

    var clientadmin = await db.activity_mapping.findAll({
      where: clientwhere,
      // logging : true,
      attributes: [
        "client_activities.*",
        "activity_mapping.client_activity_id",
        "activity_mapping.library_id",
      ],
      include: [
        {
          model: db.client_admin_activities,
          as: "client_activities",
          // where: { organization_id: req.organization_id },
          where : {
           status : {
            [Op.notIn]: [master.status.delete]
           },
          },
          attributes: [],
          nested: false,
          required: true,
        },
      ],
      group: ["client_activities.id"],
      raw: true,
    });

  

      let today = new Date();
      let fromDate =
      today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
      let toDate =
      today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

      // console.log("admin " +admin.length , "clientadmin " + clientadmin.length); return;

    let final = clientadmin.concat(admin);
    let idx_a = 0;
    for (const element of final) {
      
      let cond = ""; 
      if (
        element.client_activity_id != "undefined" &&
        element.client_activity_id != undefined
      ) {
        // console.log(element.client_activity_id);
        cond = ` and client_activity_id=${element.client_activity_id}`;
      } else {
        //console.log(element.admin_activity_id);
        cond = ` and admin_activity_id='${element.admin_activity_id}'`;
      }

      subids = await db.sequelize.query(
        `select substandard_id from activity_mapping where library_id='${element.library_id}' ${cond} and organization_id in (0,${req.organization_id}) `,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (subids.length > 0) {
        subids = subids.map((el) => el.substandard_id);
      }
      final[idx_a].subid = subids;
      let updatorassesmentquery = "";

      if (element.type == 1) {
        
        let responseHeadList = await helper.getStartAndEndDate(
          fromDate,
          toDate,
          element.response_frequency,
          element.submission_day
        );

        
        if (responseHeadList) {
          cond = cond +  ` and response_date between date_format('${responseHeadList.startDate}','%Y-%m-%d') and date_format('${responseHeadList.endDate}','%Y-%m-%d')`;
        }

        updatorassesmentquery = `select count(*) as totalUpdatorRes from storage_activity_checklist where organization_id=${req.organization_id} ${cond} `;
      } else if (element.type == 2) {

        let responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          element.response_frequency,
          element.submission_day
        );

        for (const responseHead of responseHeadList) {

        let firstDate = helper.dateFormatUSA(responseHead.responseDate);
        let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);

        cond = cond + ` and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d') `;
        }
        if (element.kpi == 1) {
          updatorassesmentquery = `select count(*) as totalUpdatorRes  from storage_activity_kpi_elements as A left join storage_activity_kpi as B
          on A.storage_id = B.id  where organization_id=${req.organization_id} ${cond} `;
        } else {
          updatorassesmentquery = ` select count(*) as totalUpdatorRes  from storage_observation  where organization_id=${req.organization_id} ${cond}`;
        }
      } else {

        let responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          element.response_frequency,
          element.submission_day
        );

        for (const responseHead of responseHeadList) {
          let firstDate = helper.dateFormatUSA(responseHead.responseDate);
          let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);
          cond = cond + ` and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d') `;
        }

        updatorassesmentquery = `select count(*) as totalUpdatorRes  from storage_activity_document where organization_id=${req.organization_id} ${cond} `;
      }
      const updatorassesment = await db.sequelize.query(updatorassesmentquery, {
        type: db.sequelize.QueryTypes.SELECT,
      });
      final[idx_a].updatorassesment =
        updatorassesment[0].totalUpdatorRes > 0 ? 1 : 0;
      idx_a++;
    }

    final = final.map(el =>  {
      if(el.type==1) {
        return {...el,sortItem : el.name}
      }

      if(el.type==2) {
        if(el.kpi==1) {
          return {...el,sortItem : el.kpi_name}
        } else {          
          return {...el,sortItem : el.observation_name}
        }
      }

      if(el.type==3) {
        return {...el,sortItem : el.document_name}
      }    
     
    })

    final.sort(helper.compare);

   

    res.send(final);
  } else {
    res.send({ data: "No records found" });
  }
};
