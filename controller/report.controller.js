const express = require("express");
const db = require("../models");
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const master = require("../config/default.json");
const { where } = require("sequelize");
const { getDueDate, getYtDValues } = require("../util/helper");
const helper = require("../util/helper");
exports.userReport = async (req, res) => {
  var where = { status: { [Op.notIn]: [master.status.delete] } };

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }
  db.users
    .findAll({
      where: where,
      attributes: {
        exclude: ["password", "temporary_password", "jwt", "otp"],
      },
      include: [
        { model: db.roles, as: "roles" },
        { model: db.organizations, as: "organizationJoin" },
      ],
      order: [["id", "DESC"]],
    })
    .then((data) => {
      for (let key = 0; key < data.length; key++) {
        const element = data[key];
        str = element.createdAt;

        var days = str.getDate();
        var days = days < 10 ? "0" + days : "" + days;

        var year = str.getFullYear();
        var month = str.getMonth() + 1;
        var month = month < 10 ? "0" + month : "" + month;

        var hours = str.getHours();
        var minutes = str.getMinutes();
        minutes = minutes < 10 ? "0" + minutes : minutes;
        var strTime = year + "-" + month + "-" + days;

        data[key].dataValues.createAt_format = strTime;
      }
      res.send(data);
    });
};

exports.surveyorReport = async (req, res) => {
  if (
    req.role_id == 2 ||
    req.role_id == 3 ||
    req.role_id == 4 ||
    req.role_id == 5 ||
    req.role_id == 6
  ) {
    sql = `   
          select A.id,C.name as surveyorname,C.email,D.name as company_name,C.surveyor_category,
          ( case 
          when C.surveyor_type=1 then 'Internal Surveyor'
          when C.surveyor_type=2 then 'External Surveyor'
          else null
          end 
          ) as surveyortype
          ,B.name as libraryname,(select avg(case 
          when internal_surveyor_score = 2 then 100
          when internal_surveyor_score = 1 then 50 
          else 0
          end) from score_mapping where internal_surveyor_id=A.internal_surveyor_id && library_id=A.library_id) as score,C.id as surveyor_id,A.library_id as library_id,C.surveyor_type as surveyor_type_i from score_mapping as A left join libraries as B on A.library_id=B.id 
          left join users as C on A.internal_surveyor_id = C.id
          left join organizations as D on A.organization_id = D.id 
          where  A.organization_id=${req.organization_id} && internal_surveyor_score is not null group by  library_id, internal_surveyor_id 

          Union All 

          select A.id,C.name as surveyorname,C.email,D.name as company_name,C.surveyor_category,
          ( case 
          when C.surveyor_type=1 then 'Internal Surveyor'
          when C.surveyor_type=2 then 'External Surveyor'
          else null
          end 
          ) as surveyortype
          ,B.name as libraryname,(select avg(case 
          when external_surveyor_score = 2 then 100
          when external_surveyor_score = 1 then 50 
          else 0
          end) from score_mapping where external_surveyor_id=A.external_surveyor_id && library_id=A.library_id) as score,C.id as surveyor_id,A.library_id as library_id,C.surveyor_type as surveyor_type_i from score_mapping as A left join libraries as B on A.library_id=B.id 
          left join users as C on A.external_surveyor_id = C.id
          left join organizations as D on A.organization_id = D.id 
          where  A.organization_id=${req.organization_id}  && external_surveyor_score is not null group by  library_id, external_surveyor_id
      `;

    surveyorAssessment = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (surveyorAssessment.length > 0) {
      let surveyorRepIdx = 0;
      for (const element of surveyorAssessment) {
        surveyorCatArr = element.surveyor_category;
        if (surveyorCatArr) {
          if (surveyorCatArr.includes(",")) {
            surveyortemp = surveyorCatArr.split(",");
            var surveyorinlist = "'" + surveyortemp.join("','") + "'";
            query = `select id,category_name from surveyor_categories where id in (${surveyorinlist})`;
          } else {
            query = `select id,category_name from surveyor_categories where id = '${surveyorCatArr}'`;
          }

          surveyorAssessment[surveyorRepIdx].SurveyorCategory =
            await db.sequelize.query(query, {
              type: db.sequelize.QueryTypes.SELECT,
              raw: true,
            });
        }

        let score = await getLibraryScoreSurveyor(
          req,
          element.library_id,
          element.surveyor_id,
          element.surveyor_type_i
        );

        console.log(score);

        if (surveyorAssessment[surveyorRepIdx] && score) {
          surveyorAssessment[surveyorRepIdx].score = score;
        }

        surveyorRepIdx++;
      }
    }

    return res.send(surveyorAssessment);
  }

  var where = {
    status: { [Op.notIn]: [master.status.delete] },
    [Op.or]: [
      {
        internal_surveyor_score: {
          [Op.ne]: null,
        },
      },
      {
        external_surveyor_score: {
          [Op.ne]: null,
        },
      },
    ],
  };

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }
  //console.log("111111", where);

  try {
    db.score_mapping
      .findAll({
        group: [
          "score_mapping.library_id",
          "internal_surveyor_id",
          "external_surveyor_id",
        ],
        attributes: [
          "id",
          [
            db.sequelize.fn(
              "AVG",
              db.score_mapping.sequelize.col("internal_surveyor_score")
            ),
            "internalScore",
          ],
          [
            db.sequelize.fn(
              "AVG",
              db.score_mapping.sequelize.col("external_surveyor_score")
            ),
            "externalScore",
          ],
          [
            db.sequelize.fn(
              "AVG",
              db.score_mapping.sequelize.col("updator_score")
            ),
            "updatorScore",
          ],
        ],
        where: where,
        include: [
          { model: db.organizations, as: "organizationScoreJoin" },
          { model: db.libraries, as: "libraryJoin" },
          {
            model: db.users,
            as: "internalSurveyorJoin",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
            include: [
              { model: db.surveyor_categories, as: "categorydetailsJoin" },
            ],
          },
          {
            model: db.users,
            as: "externalSurveyorJoin",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
            include: [
              { model: db.surveyor_categories, as: "categorydetailsJoin" },
            ],
          },
        ],
      })
      .then(async (data) => {
        surveyorCategory = null;
        idx = 0;
        if (data.length > 0) {
          for (const element of data) {
            surveyorCatArr = null;
            if (element.internalSurveyorJoin) {
              surveyorCatArr = element.internalSurveyorJoin.surveyor_category;
            }
            if (element.externalSurveyorJoin) {
              surveyorCatArr = element.null.surveyor_category;
            }

            if (surveyorCatArr) {
              if (surveyorCatArr.includes(",")) {
                surveyortemp = surveyorCatArr.split(",");
                var surveyorinlist = "'" + surveyortemp.join("','") + "'";
                query = `select id,category_name from surveyor_categories where id in (${surveyorinlist})`;
              } else {
                query = `select id,category_name from surveyor_categories where id = '${surveyorCatArr}'`;
              }

              data[idx].dataValues.SurveyorCategory = await db.sequelize.query(
                query,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                  raw: true,
                }
              );
            }

            data[idx].dataValues.internalScore =
              element.dataValues.internalScore * 50;
            if (data.length == idx + 1) {
              res.send(data);
            }
            idx++;
          }
        } else {
          res.send([]);
        }
      });
  } catch (error) {
    res.send({ error: error });
  }
};
exports.updatorReport = async (req, res) => {
  var where = { status: { [Op.notIn]: [master.status.delete] } };

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }
  //console.log("111111",where)
  where.updator_score = {
    [Op.ne]: null,
  };

  const updaterlists = await db.score_mapping.findAll({
    group: ["library_id", "updator_id"],
    attributes: [
      "id",
      "updator_id",
      // [
      //   db.sequelize.fn(
      //     "AVG",
      //     db.score_mapping.sequelize.col("updator_score")
      //   ),
      //   "updatorScore",
      // ],
    ],
    where: where,
    include: [
      { model: db.organizations, as: "organizationScoreJoin" },
      { model: db.libraries, as: "libraryJoin" },
      {
        model: db.users,
        as: "updatorJoin",
        attributes: {
          exclude: ["password", "temporary_password", "jwt", "otp"],
        },
      },
    ],
  });

  if (updaterlists.length > 0) {
    let idx = 0;
    for (const element of updaterlists) {
      let score = await getLibraryScoreUpdator(
        req,
        element.libraryJoin.id,
        element.updator_id,
        0
      );

      if (score) {
        updaterlists[idx].dataValues.updatorScore = score;
      } else {
        updaterlists[idx].dataValues.updatorScore = null;
      }

      idx++;
    }
    res.send(updaterlists);
    /*
    updaterlists.forEach(async (element, idx) => {
 
      let score = await getLibraryScoreUpdator(
        req,
        element.libraryJoin.id,
        element.updator_id,
        0
      );

      console.log(score);
      if (score) {
        updaterlists[idx].dataValues.updatorScore = score;
      } else {
        updaterlists[idx].dataValues.updatorScore = null;
      }

      if (updaterlists.length == idx + 1) {
        res.send(updaterlists);
      }
    }); */
  } else {
    res.send(updaterlists);
  }
};

getLibraryScoreAll = async (req, library_id, user_id, usertype = 0) => {
  // usertype : 0 updator, 1 internal surveyor, 2 external surveyor
  let cond = "    and pm.role_id=4 ";
  if (usertype == 0) {
    cond = `  and pm.role_id=4 `;
  }

  if (usertype > 0) {
    cond = `  and pm.role_id=5 `;
  }

  if (library_id) {
    cond = cond + ` and pm.library_id=${library_id} `;
  }

  if (user_id) {
    cond = cond + `  and pm.user_id=${user_id} `;
  }

  sql = `select chp.*  
  from property_mapping pm INNER join chapters chp on pm.chapter_id = chp.id 
  LEFT JOIN score_mapping score on chp.id = score.chapter_id and
  score.organization_id=${req.organization_id}
  where pm.organization_id=${req.organization_id} and chp.status not in (2)   
  ${cond}  group by chp.id
  `;

  console.log(sql);

  assignedChapters = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  //console.log(assignedChapters.length);

  chaptersScore = [];
  for (const chapter of assignedChapters) {
    if (usertype == 0) {
      sqlsc = `select (select avg(updator_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and updator_id=${user_id} and standard_id=A.standard_id) as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and updator_id=${user_id} 
      group by standard_id order by substanard_id desc`;
    } else if (usertype == 1) {
      sqlsc = `select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and internal_surveyor_id=${user_id} and standard_id=A.standard_id) as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and internal_surveyor_id=${user_id} 
      group by standard_id order by substanard_id desc`;
    } else if (usertype == 2) {
      sqlsc = `select (select avg(external_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and external_surveyor_id=${user_id} and standard_id=A.standard_id) as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and external_surveyor_id=${user_id} 
      group by standard_id order by substanard_id desc`;
    }

    // console.log(sqlsc);

    userScore = await db.sequelize.query(sqlsc, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (userScore.length > 0) {
      score =
        userScore.map((el) => +el.newscore).reduce((a, b) => a + b, 0) /
        userScore.length;

      chaptersScore.push(score.toFixed(2));
    }
  }

  //console.log(chaptersScore);

  if (chaptersScore.length > 0) {
    score =
      chaptersScore.map((el) => +el).reduce((a, b) => a + b, 0) /
      chaptersScore.length;

    //console.log(score);

    return score;
  } else {
    return "";
  }
};

getLibraryScore = async (req, library_id, user_id, usertype = 0) => {
  // usertype : 0 updator, 1 internal surveyor, 2 external surveyor
  let cond = "    and pm.role_id=4 ";
  if (usertype == 0) {
    cond = `  and pm.role_id=4 `;
  }

  if (usertype > 0) {
    cond = `  and pm.role_id=5 `;
  }

  sql = `select chp.*  
  from property_mapping pm INNER join chapters chp on pm.chapter_id = chp.id 
  LEFT JOIN score_mapping score on chp.id = score.chapter_id and
  score.organization_id=${req.organization_id}
  where pm.organization_id=${req.organization_id} and chp.status not in (2) and pm.library_id=${library_id} and pm.user_id=${user_id} 
  and pm.user_id=${user_id}  ${cond}  group by chp.id
  `;

  //console.log(sql);

  assignedChapters = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  //console.log(assignedChapters.length);

  chaptersScore = [];
  for (const chapter of assignedChapters) {
    if (usertype == 0) {
      sqlsc = `select (select avg(updator_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and updator_id=${user_id} and standard_id=A.standard_id) as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and updator_id=${user_id} 
      group by standard_id order by substanard_id desc`;
    } else if (usertype == 1) {
      sqlsc = `select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and internal_surveyor_id=${user_id} and standard_id=A.standard_id) as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and internal_surveyor_id=${user_id} 
      group by standard_id order by substanard_id desc`;
    } else if (usertype == 2) {
      sqlsc = `select (select avg(external_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and external_surveyor_id=${user_id} and standard_id=A.standard_id) as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and external_surveyor_id=${user_id} 
      group by standard_id order by substanard_id desc`;
    }

    // console.log(sqlsc);

    userScore = await db.sequelize.query(sqlsc, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (userScore.length > 0) {
      score =
        userScore.map((el) => +el.newscore).reduce((a, b) => a + b, 0) /
        userScore.length;

      chaptersScore.push(score.toFixed(2));
    }
  }

  //console.log(chaptersScore);

  if (chaptersScore.length > 0) {
    score =
      chaptersScore.map((el) => +el).reduce((a, b) => a + b, 0) /
      chaptersScore.length;

    //console.log(score);

    return score;
  } else {
    return "";
  }
};

getExpiryDate = (responseDate, response_frequency) => {
  if (
    responseDate == null ||
    responseDate == "" ||
    response_frequency == "" ||
    response_frequency == null
  ) {
    return null;
  }

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();
  responseDate = new Date(responseDate);
  today = new Date(yyyy + "-" + mm + "-" + dd);
  expiryDate = responseDate;
  if (today.getTime() <= responseDate.getTime()) {
    expiryDate = responseDate;
    return expiryDate;
  } else {
    if (response_frequency == "Annual") {
      while (today.getTime() <= expiryDate.getTime()) {
        expiryDate = responseDate.setFullYear(responseDate.getFullYear() + 1);
      }
    } else if (response_frequency == "Monthly") {
      while (today.getTime() <= expiryDate.getTime()) {
        expiryDate = expiryDate.setMonth(expiryDate.getMonth() + 1);
      }
    } else if (response_frequency == "Biannual") {
      while (today.getTime() <= expiryDate.getTime()) {
        expiryDate = responseDate.setMonth(responseDate.getMonth() + 6);
      }
    } else if (response_frequency == "Quarterly") {
      while (today.getTime() <= expiryDate.getTime()) {
        expiryDate = responseDate.setMonth(responseDate.getMonth() + 3);
      }
    } else if (response_frequency == "Weekly") {
      while (today.getTime() <= expiryDate.getTime()) {
        expiryDate = responseDate.setDate(responseDate.getDate() + 1);
      }
    }
    //expiryDate = new Date();
  }

  var newExpiryDate = new Date();
  var dd = String(expiryDate.getDate()).padStart(2, "0");
  var mm = String(expiryDate.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = expiryDate.getFullYear();

  return yyyy + "-" + mm + "-" + dd;
};

exports.checkListDocuments = async (req, res) => {
  //console.log('role id',req.role_id);

  let fromDate = req.query.fromDate;
  let toDate = req.query.toDate;
  let org_id = 0;

  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  let where = { status: { [Op.notIn]: [master.status.delete] } };
  if (req.role_id == 4) {
    // console.log('role id',req.role_id);
    where = {
      status: { [Op.notIn]: [master.status.delete] },
      updator_id: req.userId,
    };
  }

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  if (
    req.role_id == 4 ||
    req.role_id == 5 ||
    req.role_id == 6 ||
    req.role_id == 2 ||
    req.role_id == 3
  ) {
    // group by m.id order by d.id desc
    //  #(select count(*) from activity_elements where admin_activity_id=m.admin_activity_id) as noofelement,
    let userRoleConds = "";
    //if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
    if (req.role_id == 4) {
      // userRoleConds = `&& B.updator_id=${req.userId} `;
    }

    let dateCond = "";
    //date_format("%Y-%m-%d",A.createdAt)
    if (fromDate && fromDate != "" && toDate && toDate != "") {
      dateCond = ` && date_format(A.createdAt,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    let sql = `
  select A.id,C.id as admin_activity_id,null as client_activity_id ,A.attachment_link,replace(A.attachment_link,"public/uploads/","") as document_name,B.file_no,'Checklist' as activity_type,C.name as activity,
  C.code,L.name as libraryname,D.name as assignTo,E.name as company_name,A.updatedAt as uploaded_date,date_format(A.createdAt,"%Y-%m-%d") as filterDate from 
  storage_activity_checklist_elements as A 
  left join storage_activity_checklist as B on A.storage_id = B.id && B.organization_id=${req.organization_id} && A.attachment_link is not null && B.admin_activity_id is not null
  left join admin_activities as C on B.admin_activity_id = C.id 
  left join activity_mapping as AM on C.id = AM.admin_activity_id  && AM.organization_id in (0,${req.organization_id})   && AM.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id})
  left join property_mapping as PM on AM.substandard_id = PM.substandard_id && AM.standard_id = PM.standard_id && PM.organization_id=${req.organization_id}
  left join libraries as L on AM.library_id = L.id
  left join users as D on B.updator_id = D.id
  left join organizations as E on B.organization_id = E.id 
  where B.organization_id = ${req.organization_id} ${userRoleConds} && B.file_no is not null and (A.attachment_link !='' and A.attachment_link is not null) ${dateCond} group by A.id
    
    `;

    // console.log(sql);

    let adminActivities = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    const clientActivities = await db.sequelize.query(
      `select A.id,null as admin_activity_id,C.id as client_activity_id,A.attachment_link,replace(A.attachment_link,"public/uploads/","") as document_name,B.file_no,'Checklist' as activity_type,C.name as activity,
      C.code,L.name as libraryname,D.name as assignTo,E.name as company_name,A.updatedAt as uploaded_date from 
      storage_activity_checklist_elements as A 
      left join storage_activity_checklist as B on A.storage_id = B.id && B.organization_id=${req.organization_id} && A.attachment_link is not null && B.client_activity_id is not null
      left join client_admin_activities as C on B.client_activity_id = C.id 
      left join activity_mapping as AM on C.id = AM.client_activity_id  && AM.organization_id in (0,${req.organization_id})   && AM.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id})
      left join property_mapping as PM on AM.substandard_id = PM.substandard_id && AM.standard_id = PM.standard_id && PM.organization_id=${req.organization_id}
      left join libraries as L on AM.library_id = L.id
      left join users as D on B.updator_id = D.id
      left join organizations as E on B.organization_id = E.id 
      where B.organization_id = ${req.organization_id}  ${userRoleConds}  && B.file_no is not null and (A.attachment_link !='' and A.attachment_link is not null) ${dateCond}  group by A.id`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    //console.log(clientActivities);

    if (clientActivities.length > 0) {
      adminActivities = adminActivities.concat(clientActivities);
    }

    return res.send(adminActivities);
  }
};

exports.reportAll = async (req, res) => {
  let fromDate = req.query.fromDate;
  let toDate = req.query.toDate;

  let today = new Date();
  if (!fromDate && !toDate) {
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
  }

  let userRoleConds = "";

  if (
    req.role_id == 4 ||
    req.role_id == 5 ||
    req.role_id == 6 ||
    req.role_id == 2 ||
    req.role_id == 3
  ) {
    roleCond = " && p.role_id=4";

    if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
      userRoleConds = ` && p.user_id=${req.userId} `;
      roleCond = `  && p.role_id=${req.role_id}`;
    }

    const property_mapping = ` select * from property_mapping as p where  organization_id=${req.organization_id}  ${roleCond} and (status=1 || status is null)
    and library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} and status=1) 
     group by substandard_id  `;

    let sql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
      c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
      m.id,A.type,A.submission_day,A.response_frequency,A.id as admin_activity_id,m.client_activity_id,m.library_id 
      from activity_mapping m left join admin_activities as A  on m.admin_activity_id=A.id and m.organization_id in (0,${req.headers["organization"]})  && m.admin_activity_id is not null
      left join (${property_mapping}) as p on p.substandard_id = m.substandard_id  
      left join libraries as c on m.library_id=c.id
      left join organizations as d on d.id=${req.headers["organization"]}
      left join users as e on e.id = p.user_id
      where m.library_id in (select library_id from organization_libraries where organization_id=${req.headers["organization"]} and status=1) ${userRoleConds}  
      and A.id is not null  group by A.id,m.library_id
      `;

    let clientSql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
      c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
      m.id,A.type,A.submission_day,A.response_frequency,A.id as client_activity_id,m.library_id 
      from activity_mapping m left join admin_activities as A  on m.client_activity_id=A.id and m.organization_id in (0,${req.headers["organization"]})  && m.client_activity_id is not null
      left join (${property_mapping}) as p on p.substandard_id = m.substandard_id  
      left join libraries as c on m.library_id=c.id
      left join organizations as d on d.id=${req.headers["organization"]}
      left join users as e on e.id = p.user_id
      where m.library_id in (select library_id from organization_libraries where organization_id=${req.headers["organization"]} and status=1) ${userRoleConds}  
      and A.id is not null  group by A.id,m.library_id
      `;

    /*
    if(req.role_id==4 || req.role_id==5) {

       sql = `  select    A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
       c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
       m.id,A.type,A.submission_day,A.response_frequency,A.id as admin_activity_id,m.client_activity_id,m.library_id 
      
      from (select * from activity_mapping where library_id in (346,345) 
and organization_id in (0,508) and status=1  and admin_activity_id is not null ) m left join admin_activities as A  on m.admin_activity_id=A.id 
      left join ( select * from property_mapping as p where  organization_id=508  && p.user_id=1870  && p.role_id=4 and (status=1 || status is null)
    and library_id in (346,345)
     group by substandard_id  ) as p on p.substandard_id = m.substandard_id
      left join libraries as c on m.library_id=c.id
       left join organizations as d on d.id=508
      left join users as e on e.id = p.user_id
        where  
        A.id is not null  group by A.id,m.library_id
      `;

       clientSql = `  select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
       c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
       m.id,A.type,A.submission_day,A.response_frequency,A.id as client_activity_id,m.library_id       
      from (select * from activity_mapping where library_id in (346,345) 
and organization_id in (0,508) and status=1  and client_activity_id is not null ) m left join client_admin_activities as A  on m.client_activity_id=A.id 
      left join ( select * from property_mapping as p where  organization_id=508  && p.user_id=1870  && p.role_id=4 and (status=1 || status is null)
    and library_id in (346,345)
     group by substandard_id  ) as p on p.substandard_id = m.substandard_id
      left join libraries as c on m.library_id=c.id
       left join organizations as d on d.id=508
      left join users as e on e.id = p.user_id
        where  
        A.id is not null  group by A.id,m.library_id
      `;

    }
      */

    let adminActivities = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
      raw: true,
    });

    let clientActivities = await db.sequelize.query(clientSql, {
      type: db.sequelize.QueryTypes.SELECT,
      raw: true,
    });

    let admin_activity_ids_arr = adminActivities.map(
      (el) => el.admin_activity_id !== null && el.admin_activity_id
    );

    admin_activity_ids_arr = admin_activity_ids_arr.toString();
    admin_activity_ids_temp = admin_activity_ids_arr.split(",");
    let admin_activity_ids_arr_list =
      "'" + admin_activity_ids_temp.join("','") + "'";

    let activityOrganization = await db.sequelize.query(
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

    if (clientActivities.length > 0) {
      adminActivities = adminActivities.concat(clientActivities);
    }

    //checklist type start
    const checklistActivities = adminActivities.filter(function (e) {
      return e.type == 1;
    });

    let i = 0;
    for (const activity of checklistActivities) {
      if (checklistActivities[i]) {
        checklistActivities[i].noofelement = 0;
        checklistActivities[i].noofresponse = 0;

        let userCond = `&& substandard_id in (select substandard_id from activity_mapping as m left join
    organization_libraries as B on m.library_id = B.library_id where B.organization_id = ${req.organization_id} )`;

        if (req.role_id > 3) {
          userCond = `&& substandard_id in (select substandard_id from property_mapping  
                where organization_id = ${req.organization_id} && user_id=${req.userId} && role_id=${req.role_id} )`;
        }
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
          resultAct = await db.sequelize.query(`select
      (select count(*) from activity_elements where((admin_activity_id = '${activity.admin_activity_id}' && organization_id is null)
        || (admin_activity_id = '${activity.admin_activity_id}' && organization_id=${req.headers["organization"]})) ${userCond} ) as noofelement,
          (select count(*) from storage_activity_checklist where admin_activity_id = '${activity.admin_activity_id}' && organization_id=${req.headers["organization"]} ${whereActivity} ) as noofresponse,
          (select avg(score) from storage_activity_checklist where admin_activity_id = '${activity.admin_activity_id}' && organization_id=${req.headers["organization"]} ${whereActivity} ) as score
            from property_mapping limit 1`);
        } else {
          resultAct = await db.sequelize.query(`select
      (select count(*) from activity_elements where((client_activity_id = '${activity.client_activity_id}' && organization_id is null) || (client_activity_id = '${activity.client_activity_id}' && organization_id=${req.headers["organization"]}))  ${userCond}) as noofelement,
        (select count(*) from storage_activity_checklist where client_activity_id = '${activity.client_activity_id}' && organization_id=${req.headers["organization"]}  ${whereActivity} ) as noofresponse,
        (select avg(score) from storage_activity_checklist where client_activity_id = '${activity.client_activity_id}' && organization_id=${req.headers["organization"]}  ${whereActivity} ) as score
            from property_mapping limit 1`);
        }

        if (resultAct.length > 0 && checklistActivities[i]) {
          checklistActivities[i].noofelement = resultAct[0][0].noofelement;
          checklistActivities[i].noofresponse = resultAct[0][0].noofresponse;
          checklistActivities[i].score = resultAct[0][0].score;
          checklistActivities[i].status =
            resultAct[0][0].noofresponse > 0 ? "Completed" : "Pending";
        }
      }
      i++;
    }

    checklistActivities.forEach((activity, idx) => {
      const dueDate = getDueDate(
        activity.submission_day,
        activity.response_frequency
      );
      checklistActivities[idx].dueDate = dueDate;
    });
    //checklist type end

    //document type start
    const documentActivities = adminActivities.filter(function (e) {
      return e.type == 3;
    });

    let newActivityArr = [];

    for (const activity of documentActivities) {
      let fromDate = req.query.fromDate;
      let toDate = req.query.toDate;

      let today = new Date();
      if (!fromDate && !toDate) {
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
      }

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
        let stoageRes = {
          document_link: "",
          document_name: "",
          comment: "",
          expiry_date: responseHead.responseEndDate,
          status: "Pending",
          response_date: null,
          storage_id: null,
        };
        if (storage_activity_documents.length) {
          stoageRes = {
            document_link: storage_activity_documents[0].document_link,
            comment: storage_activity_documents[0].comment,
            expiry_date: storage_activity_documents[0].expiry_date,
            document_name: storage_activity_documents[0].document_name,
            status: "Completed",
            response_date: storage_activity_documents[0].responsedate,
          };
        }

        newActivityArr.push({
          ...activity,
          ...stoageRes,
          response: responseHead.week,
        });
      }
    }

    newActivityArr.forEach((element, idx) => {
      newActivityArr[idx].document_name = element.document_link
        ? element.document_link.replace("public/uploads/", "")
        : null;
      let expiry_date = helper.getDueDate(
        element.submission_day,
        element.response_frequency,
        element.response_date
      );
      // newActivityArr[idx].expiry_date = expiry_date; expiry date is already there
    });

    newActivityArr = newActivityArr.map((el) => ({
      ...el,
      activity: el.doc_Activity_name ? el.doc_Activity_name : el.activity,
    }));

    //document type end

    //kpi start

    let kpiActivities = adminActivities.filter(function (e) {
      return e.type == 2 && e.kpi == 1;
    });

    let idx = 0;
    for (const element of kpiActivities) {
      let actCond = ` B.client_activity_id = '${element.client_activity_id}' `;
      if (element.admin_activity_id) {
        actCond = ` B.admin_activity_id = '${element.admin_activity_id}' `;
      }

      if (!fromDate && !toDate) {
        fromDate = today.getFullYear() + "-01-01";
        toDate = today.getFullYear() + "-12-31";
      }

      let responseHeadList = await helper.getStartAndEndDate(
        fromDate,
        toDate,
        element.response_frequency,
        element.submission_day
      );

      if (fromDate && toDate) {
        actCond =
          actCond +
          ` and responsedate between date_format('${responseHeadList.startDate}','%Y-%m-%d') and date_format('${responseHeadList.endDate}','%Y-%m-%d') `;
      }

      if (kpiActivities[idx]) {
        scoreList = await db.sequelize.query(
          `select * from storage_activity_kpi_elements as A left join storage_activity_kpi as B
        on A.storage_id = B.id where  ${actCond} and organization_id=${req.organization_id}   `,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        //kpi Calculation
        let avgYtdValue = 0;
        let avgYtdScore = 0;
        if (scoreList.length > 0) {
          let scoreidx = 0;

          for (const element of scoreList) {
            avgYtdValue = 0;
            avgYtdScore = 0;
            itemFreq = element.frequency;
            //  console.log(itemFreq);
            itemIndex = scoreList.findIndex(
              (score) => score.frequency == itemFreq
            );
            // console.log(itemIndex);
            const kpiscoresList = scoreList.filter(
              (el, idx) => idx <= itemIndex
            );
            // console.log(kpiscoresList);

            let ytd = await getYtDValues(kpiscoresList, itemFreq);

            scoreList[scoreidx].ytdValue = ytd.actualValue;
            scoreList[scoreidx].ytdScore = ytd.actualScore;
            scoreidx++;
          }
          avgYtdValue =
            scoreList.reduce((a, b) => +a + +b.ytdValue, 0) / scoreList.length;
          avgYtdScore =
            scoreList.reduce((a, b) => +a + +b.ytdScore, 0) / scoreList.length;
        }

        let expiry_date = getDueDate(
          element.submission_day,
          element.response_frequency,
          element.response_date
        );

        kpiActivities[idx].expiry_date = expiry_date;
        kpiActivities[idx].scores = scoreList;
        kpiActivities[idx].avgYtdValue = avgYtdValue;
        kpiActivities[idx].avgYtdScore = avgYtdScore;
        kpiActivities[idx].status =
          scoreList.length > 0 ? "Completed" : "Pending";
      }

      idx++;
    }

    //kpi end

    //observation start
    let observationActivities = adminActivities.filter(function (e) {
      return e.type == 2 && e.kpi == 0;
    });

    observationActivities.forEach((element, idx) => {
      expiry_date = getDueDate(
        element.submission_day,
        element.response_frequency,
        element.response_date
      );
      observationActivities[idx].expiry_date = expiry_date;
    });

    const newOBSActivityArr = [];
    fromDate = req.query.fromDate;
    toDate = req.query.toDate;
    today = new Date();
    if (!fromDate && !toDate) {
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
    }

    for (const activity of observationActivities) {
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

        if (activity.client_admin_activity) {
          where = ` and client_activity_id=${activity.client_admin_activity} and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;
        }

        let storageDetails = await db.sequelize.query(
          `select * from storage_observation where organization_id = ${req.organization_id} ${where} order by responsedate`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        let kpiStorageObj = {
          actualvalue: null,
          comments: "",
          response_date: null,
          status: "Pending",
        };
        if (storageDetails.length > 0) {
          kpiStorageObj = {
            actualvalue: storageDetails[0].currency,
            comments: storageDetails[0].comments,
            response_date: storageDetails[0].response_date,
            status: "Completed",
          };
        }

        newOBSActivityArr.push({
          ...activity,
          ...kpiStorageObj,
          response: responseHead.week,
          responseDate: responseHead.responseDate,
          responseEndDate: responseHead.responseEndDate,
        });
      }
    }
    //observation end

    res.send({
      checklistActivities,
      documentActivities: newActivityArr,
      kpiActivities,
      observationActivities: newOBSActivityArr,
    });
  } else {
    res.send([]);
  }
};

exports.checklistReport = async (req, res) => {
  let fromDate = req.query.fromDate;
  let toDate = req.query.toDate;

  let today = new Date();
  if (!fromDate && !toDate) {
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
  }

  let org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }

  let userRoleConds = "";

  if (
    req.role_id == 4 ||
    req.role_id == 5 ||
    req.role_id == 6 ||
    req.role_id == 2 ||
    req.role_id == 3
  ) {
    let roleCond = " && p.role_id=4";
    let assignedLibraries = null;
    if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
      userRoleConds = ` && p.user_id=${req.userId} `;
      roleCond = `  && p.role_id=${req.role_id}`;
    }

    let property_mapping = ` select * from property_mapping as p where  organization_id=${req.organization_id}  ${roleCond} and (status=1 || status is null)
    and library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} and status=1) 
     group by substandard_id  `;

    let sql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
      c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
      m.id,A.type,A.submission_day,A.response_frequency,A.id as admin_activity_id,m.client_activity_id,m.library_id 
      from activity_mapping m left join admin_activities as A  on m.admin_activity_id=A.id and m.organization_id in (0,${req.headers["organization"]})  && m.admin_activity_id is not null
      left join (${property_mapping}) as p on p.substandard_id = m.substandard_id  
      left join libraries as c on m.library_id=c.id
      left join organizations as d on d.id=${req.headers["organization"]}
      left join users as e on e.id = p.user_id
      where m.library_id in (select library_id from organization_libraries where organization_id=${req.headers["organization"]} and status=1) ${userRoleConds}  
      and A.id is not null  group by A.id,m.library_id
      `;

    let clientSql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
      c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
      m.id,A.type,A.submission_day,A.response_frequency,A.id as client_activity_id,m.library_id 
      from activity_mapping m left join client_admin_activities as A  on m.client_activity_id=A.id and m.organization_id in (0,${req.headers["organization"]})  && m.client_activity_id is not null
      left join (${property_mapping}) as p on p.substandard_id = m.substandard_id  
      left join libraries as c on m.library_id=c.id
      left join organizations as d on d.id=${req.headers["organization"]}
      left join users as e on e.id = p.user_id
      where m.library_id in (select library_id from organization_libraries where organization_id=${req.headers["organization"]} and status=1) ${userRoleConds}  
      and A.id is not null  group by A.id,m.library_id
      `;

    // (345,346,354)

    if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
      let assignedLibs = await db.property_mapping
        .findAll({
          where: {
            user_id: req.userId,
            role_id: req.role_id,
          },
          group: ["library_id"],
        })
        .then((result) => {
          if (result.length > 0) {
            return result.map((el) => el.library_id);
          }
          return [];
        });

      if (assignedLibs.length > 0) {
        assignedLibraries = "'" + assignedLibs.join("','") + "'";
      }

      sql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
        c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
        m.id,A.type,A.submission_day,A.response_frequency,A.id as admin_activity_id,m.client_activity_id,m.library_id 
        from (select * from activity_mapping where library_id in (${assignedLibraries}) && organization_id in (0,${req.organization_id})  && admin_activity_id is not null ) m 
        left join admin_activities as A  on m.admin_activity_id=A.id 
        left join ( select * from property_mapping as p where  organization_id=${req.organization_id}  && p.role_id=${req.role_id} and (status=1 || status is null)
        and library_id in (${assignedLibraries})
       group by substandard_id  ) as p on p.substandard_id = m.substandard_id
        left join libraries as c on m.library_id=c.id
        left join organizations as d on d.id=${req.organization_id}
        left join users as e on e.id = p.user_id
        where p.user_id=${req.userId}
         and A.id is not null  group by A.id,m.library_id`;

      clientSql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
         c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
         m.id,A.type,A.submission_day,A.response_frequency,m.client_activity_id,m.library_id 
         from (select * from activity_mapping where library_id in (${assignedLibraries}) && organization_id in (0,${req.organization_id})  && client_activity_id is not null ) m 
         inner join client_admin_activities as A  on m.client_activity_id=A.id 
         left join ( select * from property_mapping as p where  organization_id=${req.organization_id}  && p.role_id=${req.role_id} and (status=1 || status is null)
         and library_id in (${assignedLibraries})
        group by substandard_id  ) as p on p.substandard_id = m.substandard_id
         left join libraries as c on m.library_id=c.id
         left join organizations as d on d.id=${req.organization_id}
         left join users as e on e.id = p.user_id
         where p.user_id=${req.userId} and A.type=1
          and A.id is not null  group by A.id,m.library_id`;
    }

    if (req.role_id == 2 || req.role_id == 3) {
      let assignedLibs = await db.organization_libraries
        .findAll({
          where: {
            organization_id: req.organization_id,
            status: 1,
          },
          group: ["library_id"],
        })
        .then((result) => {
          if (result.length > 0) {
            return result.map((el) => el.library_id);
          }
          return [];
        });

      if (assignedLibs.length > 0) {
        assignedLibraries = "'" + assignedLibs.join("','") + "'";
      }

      property_mapping = ` select * from property_mapping as p where  organization_id=${req.organization_id}  ${roleCond} and (status=1 || status is null)
      and library_id in  (${assignedLibraries}) group by substandard_id  `;

      let activity_mapping = `(select * from activity_mapping where library_id in (${assignedLibraries}) && organization_id in (0,${req.organization_id})  && admin_activity_id is not null )`;

      sql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
      c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
      m.id,A.type,A.submission_day,A.response_frequency,A.id as admin_activity_id,m.client_activity_id,m.library_id 
      from ${activity_mapping} m left join admin_activities as A  on m.admin_activity_id=A.id
      left join (${property_mapping}) as p on p.substandard_id = m.substandard_id  
      left join libraries as c on m.library_id=c.id
      left join organizations as d on d.id=${req.headers["organization"]}
      left join users as e on e.id = p.user_id
      where m.library_id in (${assignedLibraries}) ${userRoleConds}  
      and A.id is not null  group by A.id,m.library_id
      `;

      activity_mapping = `(select * from activity_mapping where library_id in (${assignedLibraries}) && organization_id in (${req.organization_id})  && client_activity_id is not null )`;

      clientSql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
      c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
      m.id,A.type,A.submission_day,A.response_frequency,A.id as client_activity_id,m.library_id 
      from ${activity_mapping} m left join client_admin_activities as A  on m.client_activity_id=A.id
      left join (${property_mapping}) as p on p.substandard_id = m.substandard_id  
      left join libraries as c on m.library_id=c.id
      left join organizations as d on d.id=${req.headers["organization"]}
      left join users as e on e.id = p.user_id
      where m.library_id in (${assignedLibraries}) ${userRoleConds}  
      and A.id is not null  group by A.id,m.library_id
      `;
    }

    let adminActivities = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
      raw: true,
    });

    let clientActivities = await db.sequelize.query(clientSql, {
      type: db.sequelize.QueryTypes.SELECT,
      raw: true,
    });

    let admin_activity_ids_arr = adminActivities.map(
      (el) => el.admin_activity_id !== null && el.admin_activity_id
    );

    admin_activity_ids_arr = admin_activity_ids_arr.toString();
    admin_activity_ids_temp = admin_activity_ids_arr.split(",");
    let admin_activity_ids_arr_list =
      "'" + admin_activity_ids_temp.join("','") + "'";

    let activityOrganization = await db.sequelize.query(
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

    if (clientActivities.length > 0) {
      adminActivities = adminActivities.concat(clientActivities);
    }

    //checklist type start
    let checklistActivities = adminActivities.filter(function (e) {
      return e.type == 1;
    });

    //checklistActivities = checklistActivities.slice(10,4);

    let substandardsList = null;

    /*let clientAdminSubstandards = await db.sequelize
      .query(
        `select A.substandard_uid from sub_standards as A left join standards as B on A.standard_id = B.id
    left join chapters as C on C.id = B.chapter_id where library_id in
    (${assignedLibraries})`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then((substds) => substds.map((el) => el.substandard_uid));

    clientAdminSubstandards = clientAdminSubstandards.toString();
    clientAdminSubstandards_temp = clientAdminSubstandards.split(",");
    substandardsList = "'" + clientAdminSubstandards_temp.join("','") + "'"; */
    // let clientAdminSubstandardsList = await db.sequelize
    //   .query(
    //     `select A.substandard_uid,C.library_id from sub_standards as A left join standards as B on A.standard_id = B.id
    // left join chapters as C on C.id = B.chapter_id where library_id in
    // (${assignedLibraries})`,
    //     {
    //       type: db.sequelize.QueryTypes.SELECT,
    //     }
    //   )

    let i = 0;
    for (const activity of checklistActivities) {
      if (checklistActivities[i]) {
        checklistActivities[i].noofelement = 0;
        checklistActivities[i].noofresponse = 0;

        let actCondfilter = ``;
        if (activity.admin_activity_id) {
          actCondfilter = ` admin_activity_id = '${activity.admin_activity_id}'`;
        } else {
          actCondfilter = ` client_activity_id = '${activity.client_activity_id}'`;
        }

        let clientAdminSubstandardsList = await db.sequelize.query(
          `select A.substandard_uid,C.library_id from (select B.* from activity_mapping as A inner join sub_standards as B on A.substandard_id=B.id  && A.organization_id in (0,${req.organization_id} ) and A.library_id in  (select library_id from organization_libraries where organization_id=${req.organization_id}) and A.status !=2 and ${actCondfilter}
          group by substandard_id) as A left join standards as B on A.standard_id = B.id
          left join chapters as C on C.id = B.chapter_id where library_id in
          (${assignedLibraries})`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        let clientAdminSubstandards = clientAdminSubstandardsList
          .filter((el) => el.library_id == activity.library_id)
          .map((el) => el.substandard_uid);
        clientAdminSubstandards = clientAdminSubstandards.toString();
        clientAdminSubstandards_temp = clientAdminSubstandards.split(",");
        substandardsList = "'" + clientAdminSubstandards_temp.join("','") + "'";

        let userCond = `&& substandard_id in (select B.substandard_uid from activity_mapping as m left join
      sub_standards as B on m.substandard_id = B.id where m.library_id in (${assignedLibraries}) and organization_id in(0,${req.organization_id})) `;

        if (req.role_id > 3) {
          /* userCond = `&& substandard_id in (select substandard_id from property_mapping  
                  where organization_id = ${req.organization_id} && user_id=${req.userId} && role_id=${req.role_id} )`; */

          actCondfilter = ``;
          if (activity.admin_activity_id) {
            actCondfilter = ` admin_activity_id = '${activity.admin_activity_id}'`;
          } else {
            actCondfilter = ` client_activity_id = '${activity.client_activity_id}'`;
          }

          userCond = ` && (substandard_id in (  select substandard_uid  from property_mapping as A inner join sub_standards as B on A.substandard_id=B.id
                    where organization_id = ${req.organization_id} && user_id=${req.userId} && role_id=${req.role_id} 
                    && A.substandard_id in ( select substandard_id from activity_mapping where ${actCondfilter}) 
                    group by substandard_id) || substandard_id is null ) `;
        }
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
          resultAct = await db.sequelize.query(`select
        (select count(*) from activity_elements where((admin_activity_id = '${activity.admin_activity_id}' && organization_id is null)
          || (admin_activity_id = '${activity.admin_activity_id}' && organization_id=${req.headers["organization"]})) ${userCond} ) as noofelement,
            (select count(*) from storage_activity_checklist where admin_activity_id = '${activity.admin_activity_id}' && organization_id=${req.headers["organization"]} ${whereActivity} ) as noofresponse,
            (select avg(score) from storage_activity_checklist where admin_activity_id = '${activity.admin_activity_id}' && organization_id=${req.headers["organization"]} ${whereActivity} ) as score
              from property_mapping limit 1`);
        } else {
          resultAct = await db.sequelize.query(`select
        (select count(*) from activity_elements where((client_activity_id = '${activity.client_activity_id}' && organization_id is null) || (client_activity_id = '${activity.client_activity_id}' && organization_id=${req.headers["organization"]}))  ${userCond}) as noofelement,
          (select count(*) from storage_activity_checklist where client_activity_id = '${activity.client_activity_id}' && organization_id=${req.headers["organization"]}  ${whereActivity} ) as noofresponse,
          (select avg(score) from storage_activity_checklist where client_activity_id = '${activity.client_activity_id}' && organization_id=${req.headers["organization"]}  ${whereActivity} ) as score
              from property_mapping limit 1`);
        }

        if (resultAct.length > 0 && checklistActivities[i]) {
          checklistActivities[i].noofelement = resultAct[0][0].noofelement;
          checklistActivities[i].noofresponse = resultAct[0][0].noofresponse;
          checklistActivities[i].dueDate = responseHeadList.endDate;
          checklistActivities[i].score =
            resultAct[0][0].score > 0
              ? resultAct[0][0].score.toFixed(2)
              : resultAct[0][0].score;
          checklistActivities[i].status =
            resultAct[0][0].noofresponse > 0 ? "Completed" : "Pending";
        }

        if (
          req.role_id == 2 ||
          req.role_id == 3 ||
          req.role_id == 4 ||
          req.role_id == 5 ||
          req.role_id == 6
        ) {
          if (activity.admin_activity_id) {
            resultAct = await db.sequelize.query(
              ` select A.*, B.code as substandard_code,B.name as substandard_name,B.description as substandard_desc,B.standard_id 
            from activity_elements as A inner join  sub_standards as B on A.substandard_id=B.substandard_uid 
            && B.substandard_uid in (${substandardsList}) where admin_activity_id='${activity.admin_activity_id}' and parent_id is null and (organization_id is null or organization_id=${req.headers["organization"]}) and (substandard_id in (${substandardsList})|| substandard_id is null) group by A.substandard_id,A.element_name`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );
          } else {
            resultAct = await db.sequelize.query(
              `                  
                  select A.*,B.code as substandard_code,B.name as substandard_name,B.description as substandard_desc,B.standard_id
                  from (select * from activity_elements where client_activity_id='${activity.client_activity_id}' and parent_id is null  && (organization_id is null or organization_id=${req.headers["organization"]})) as A
                  left join  (select * from  sub_standards where id in ( select substandard_id from activity_mapping where library_id in (select library_id from organization_libraries where organization_id=${req.headers["organization"]}))) as B
                  on A.substandard_id=B.substandard_uid  group by substandard_id,element_name order by substandard_name`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );
          }

          checklistActivities[i].noofelement = resultAct.length;
        } else {
          if (activity.admin_activity_id) {
          } else {
          }
        }
      }
      i++;
    }

    // checklistActivities.forEach((activity, idx) => {
    //   const dueDate = getDueDate(
    //     activity.submission_day,
    //     activity.response_frequency
    //   );
    //   checklistActivities[idx].dueDate = dueDate;
    // });

    return res.send(checklistActivities);
  } else {
    res.send([]);
  }
};

exports.updatorActivityReport = async (req, res) => {
  let fromDate = req.query.fromDate;
  let toDate = req.query.toDate;

  if (!fromDate && !toDate) {
    let today = new Date();
    fromDate = helper.dateFormatUSA(
      today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate()
    );
    toDate = helper.dateFormatUSA(
      today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate()
    );
  }

  if (req.headers["organization"]) {
    organization_id = req.headers["organization"];
  } else {
    return res.json("Please Select organization");
  }

  const updators = await db.sequelize.query(
    `select  user_id, (select name from users where id = A.user_id) as updatorname,
      (select email from users where id = A.user_id) as updatoremail,
        (select name from libraries where id = A.library_id) as library,
          (select name from organizations where id = A.organization_id) as companyname, library_id
  from property_mapping as A where organization_id = ${organization_id} && role_id=4 group by library_id, user_id`,
    {
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (updators.length > 0) {
    let i = 0;
    for (const updator of updators) {
      userid = updator.user_id;
      updators[i].assigned_activity = 0;
      updators[i].compaletedactivity = 0;
      updators[i].incompleteactivity = 0;
      updators[i].percentCompltion = 0;

      const updatorSql = ` select * from activity_mapping where substandard_id in (
      select substandard_id from property_mapping where organization_id = ${organization_id} && user_id= ${updator.user_id} && library_id=${updator.library_id} && role_id=4 && id is not null group by substandard_id
        )  && organization_id in (0,${organization_id}) group by admin_activity_id, client_activity_id`;
      let activityList = await db.sequelize.query(updatorSql, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (activityList.length > 0) {
        updators[i].assigned_activity = activityList.length;
      }

      const activistyStatus = await helper.updatorActivityReportActivityStatus(
        req,
        activityList,
        userid,
        fromDate,
        toDate
      );

      // && S.updator_id=${updator.user_id}
      // && S.updator_id=${updator.user_id}
      // && S.updator_id=${updator.user_id}
      // && S.updator_id=${updator.user_id}
      // && S.updator_id=${updator.user_id}
      // && S.updator_id=${updator.user_id}
      // && S.updator_id=${updator.user_id}
      // && S.updator_id=${updator.user_id}

      //activity_mapping
      /*
      let completedActivity = await db.sequelize.query(`select
      (select count(distinct(M.admin_activity_id)) from  (${updatorSql}) as M left join storage_activity_checklist as S on M.admin_activity_id = S.admin_activity_id
        && S.organization_id = ${organization_id} where  S.organization_id = ${organization_id} && M.library_id=${updator.library_id}) as completedChecklist,
      (select count(distinct(M.admin_activity_id)) from  (${updatorSql}) as M left join storage_activity_document as S on M.admin_activity_id = S.admin_activity_id
        && S.organization_id = ${organization_id} where  S.organization_id = ${organization_id}  && M.library_id=${updator.library_id}) as completedDocumentEv,
          (select count(distinct(M.admin_activity_id)) from  (${updatorSql}) as M left join storage_activity_kpi as S on M.admin_activity_id = S.admin_activity_id
            && S.organization_id = ${organization_id} where  S.organization_id = ${organization_id}  && M.library_id=${updator.library_id}) as completedKpi,
              (select count(distinct(M.admin_activity_id)) from  (${updatorSql}) as M left join storage_observation as S on M.admin_activity_id = S.admin_activity_id
                && S.organization_id = ${organization_id} where  S.organization_id = ${organization_id}  && M.library_id=${updator.library_id}) as completedObs,
                  (select count(distinct(M.client_activity_id)) from  (${updatorSql}) as M inner join storage_activity_checklist as S on M.client_activity_id = S.client_activity_id
                    && S.organization_id = ${organization_id} where  S.organization_id = ${organization_id} && M.library_id=${updator.library_id} ) as completedChecklistCA,
                      (select count(distinct(M.client_activity_id)) from  (${updatorSql}) as M inner join storage_activity_document as S on M.client_activity_id = S.client_activity_id
                        && S.organization_id = ${organization_id} where  S.organization_id = ${organization_id} && M.library_id=${updator.library_id}) as completedDocumentEvCA,
                          (select count(distinct(M.client_activity_id)) from  (${updatorSql}) as M inner join storage_activity_kpi as S on M.client_activity_id = S.client_activity_id
                            && S.organization_id = ${organization_id} where  S.organization_id = ${organization_id} && M.library_id=${updator.library_id}) as completedKpiCA,
                              (select count(distinct(M.client_activity_id)) from  (${updatorSql}) as M inner join storage_observation as S on M.client_activity_id = S.client_activity_id
                                && S.organization_id = ${organization_id} where  S.organization_id = ${organization_id} && M.library_id=${updator.library_id}) as completedObsCA
      from property_mapping limit 1`);

      if (completedActivity.length > 0 && updators[i]) {
        updators[i].compaletedactivity =
          completedActivity[0][0].completedChecklist +
          completedActivity[0][0].completedChecklistCA +
          completedActivity[0][0].completedDocumentEv +
          completedActivity[0][0].completedDocumentEvCA +
          completedActivity[0][0].completedKpi +
          completedActivity[0][0].completedKpiCA +
          completedActivity[0][0].completedObs +
          completedActivity[0][0].completedObsCA;
      }
*/
      updators[i].compaletedactivity = activistyStatus.compAct;
      updators[i].incompleteactivity =
        updators[i].assigned_activity - updators[i].compaletedactivity;
      if (updators[i].assigned_activity > 0) {
        updators[i].percentCompltion =
          (updators[i].compaletedactivity / updators[i].assigned_activity) *
          100;
      }

      updators[i].percentCompltion = updators[i].percentCompltion.toFixed(2);

      i++;
    }
  }

  res.send(updators);

  // .then((data) => {
  //   if (data.length > 0) {
  //     data.forEach((element, idx) => {
  //       element.id = idx + 1;
  //     });
  //   }
  //   res.send(data);
  // })
  // .catch((error) => {
  //   console.log(error);
  //   res.send(error);
  // });
};

exports.kpiReport = async (req, res) => {
  let fromDate = req.query.fromDate;
  let toDate = req.query.toDate;

  let today = new Date();

  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  var where = { status: { [Op.notIn]: [master.status.delete] } };

  if (req.role_id == 4) {
    // console.log('role id',req.role_id);
    var where = {
      status: { [Op.notIn]: [master.status.delete] },
      updator_id: req.userId,
    };
  }

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  let sql = ``;

  if (
    req.role_id == 4 ||
    req.role_id == 5 ||
    req.role_id == 6 ||
    req.role_id == 2 ||
    req.role_id == 3
  ) {
    //|| req.role_id == 5
    let userRoleConds = "";
    roleCond = " && p.role_id=4";
    if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
      userRoleConds = ` && p.user_id=${req.userId} `;
      roleCond = `  && p.role_id=${req.role_id}`;
    }

    sql = ` select  A.kpi_name as activity, A.code, A.observation_type, m.client_activity_id, m.admin_activity_id, b.id as storage_id,
      (case when b.id is null then 'Pending' else 'Completed' end) as status,
        (select target from client_admin_datacollections where admin_activity_id = m.admin_activity_id and organization_id=${req.organization_id}  order by id desc limit 1) as target_value,
          c.name as libraryname, d.name as company_name, GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name) SEPARATOR '') as assignTo, A.kpi,
          A.type_of_measure, A.aggregation_type, A.submission_day,response_frequency, m.id  as mappingid, A.type, m.client_activity_id, m.admin_activity_id,b.createdAt as response_date,m.library_id  from activity_mapping m
left join admin_activities as A  on m.admin_activity_id = A.id  and A.type = 2 && A.kpi=1   && m.organization_id in (0,${req.organization_id})
left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id} ${roleCond}
left join storage_activity_kpi as b on A.id = b.admin_activity_id && b.organization_id=${req.organization_id}
left join libraries as c on m.library_id = c.id
left join organizations as d on d.id = ${req.organization_id}
left join users as e on e.id = p.user_id
where m.library_id in (select library_id from organization_libraries where organization_id = ${req.organization_id} and status = 1) ${userRoleConds}  and A.type = 2  group by A.code, m.library_id  order by b.id desc`;

    const sqlOrganization = ` select  A.kpi_name as activity, A.code, A.observation_type, m.client_activity_id, m.admin_activity_id, b.id as storage_id,
      (case when b.id is null then 'Pending' else 'Completed' end) as status,
        (select target from client_admin_datacollections where admin_activity_id = m.admin_activity_id  and organization_id=${req.organization_id}  order by id desc limit 1) as target_value,
          c.name as libraryname, d.name as company_name, GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name) SEPARATOR '') as assignTo, A.kpi,
          A.type_of_measure, A.aggregation_type, A.submission_day,response_frequency, m.id  as mappingid, A.type, m.client_activity_id, m.admin_activity_id,b.createdAt as response_date,m.library_id  from activity_mapping m
      left join activities_organization as A  on m.admin_activity_id = A.admin_activity_id and A.organization_id = ${req.organization_id}  and A.type = 2 and kpi = 1   && m.organization_id in (0,${req.organization_id})
    left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id} ${roleCond}
    left join storage_activity_kpi as b on A.admin_activity_id = b.admin_activity_id && b.organization_id=${req.organization_id}
    left join libraries as c on m.library_id = c.id
    left join organizations as d on d.id = ${req.organization_id}
    left join users as e on e.id = p.user_id
    where m.library_id in (select library_id from organization_libraries where organization_id = ${req.organization_id} and status = 1) ${userRoleConds}  and A.type = 2  group by A.code, m.library_id  order by b.id desc`;

    const clientsql = ` select A.kpi_name as activity, A.code, A.observation_type, m.client_activity_id, m.admin_activity_id, b.id as storage_id,
      (case when b.id is null then 'Pending' else 'Completed' end) as status,
        (select target from client_admin_datacollections where client_activity_id = m.client_activity_id and organization_id=${req.organization_id} order by id desc limit 1) as target_value,
          c.name as libraryname, d.name as company_name, GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name) SEPARATOR '') as assignTo,
          A.type_of_measure, A.aggregation_type, A.submission_day,response_frequency, A.kpi, m.id, A.type, A.id as client_activity_id, m.admin_activity_id,b.createdAt as response_date,m.library_id from activity_mapping m
left join client_admin_activities as A  on m.client_activity_id = A.id  and A.type = 2 && A.kpi=1  && m.organization_id in (0,${req.organization_id})
left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id} ${roleCond}
left join storage_activity_kpi as b on A.id = b.client_activity_id && b.organization_id=${req.organization_id}
left join libraries as c on m.library_id = c.id
left join organizations as d on d.id = ${req.organization_id}
left join users as e on e.id = p.user_id
where m.library_id in (select library_id from organization_libraries where organization_id = ${req.organization_id} and status = 1) ${userRoleConds}  and A.type = 2  group by A.code, m.library_id  order by b.id desc`;

    let allactivities = [];
    const adminActivities = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    const OrgActivities = await db.sequelize.query(sqlOrganization, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    const clientActivities = await db.sequelize.query(clientsql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (adminActivities.length > 0) {
      allactivities = [...adminActivities];
    }

    if (OrgActivities.length > 0) {
      allactivities = [...allactivities, ...OrgActivities];
    }

    allactivities = helper.removeDuplicatesFromArrayObj(
      allactivities,
      "mappingid"
    );

    if (clientActivities.length > 0) {
      allactivities = allactivities.concat(clientActivities);
    }

    let activities = allactivities.filter(function (e) {
      return e.type == 2;
    });

    let idx = 0;
    // activities = activities.slice(1,2);
    for (const element of activities) {
      let actCond = ` B.client_activity_id = '${element.client_activity_id}' `;
      if (element.admin_activity_id) {
        actCond = ` B.admin_activity_id = '${element.admin_activity_id}' `;
      }

      if (!req.query.fromDate && !req.query.toDate) {
        fromDate = today.getFullYear() + "-01-01";
        toDate = today.getFullYear() + "-12-31";
      } else {
         fromDate = req.query.fromDate;
         toDate = req.query.toDate;
      }

  
      let responseHeadList = await helper.getStartAndEndDate(
        fromDate,
        toDate,
        element.response_frequency,
        element.submission_day
      );
 

      if (fromDate && toDate) {
        actCond =
          actCond +
          ` and responsedate between date_format('${responseHeadList.startDate}','%Y-%m-%d') and date_format('${responseHeadList.endDate}','%Y-%m-%d') `;
      }

      if (activities[idx]) {

        console.log( `select * from storage_activity_kpi_elements as A left join storage_activity_kpi as B
        on A.storage_id = B.id where  ${actCond} and organization_id=${req.organization_id}  group by responsedate `);
        scoreList = await db.sequelize.query(
          `select * from storage_activity_kpi_elements as A left join storage_activity_kpi as B
        on A.storage_id = B.id where  ${actCond} and organization_id=${req.organization_id}  group by responsedate `,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        //kpi Calculation
        let avgYtdValue = 0;
        let avgYtdScore = 0;
        if (scoreList.length > 0) {
          let scoreidx = 0;

          for (const element of scoreList) {
            avgYtdValue = 0;
            avgYtdScore = 0;
            itemFreq = element.frequency;
            //  console.log(itemFreq);
            itemIndex = scoreList.findIndex(
              (score) => score.frequency == itemFreq
            );
            // console.log(itemIndex);
            const kpiscoresList = scoreList.filter(
              (el, idx) => idx <= itemIndex
            );

            let ytd = await getYtDValues(kpiscoresList, itemFreq);

            scoreList[scoreidx].ytdValue = ytd.actualValue;
            scoreList[scoreidx].ytdScore = ytd.actualScore;
            scoreidx++;
          }

          const ytdkpireport = await helper.getYTDKPIReport(
            req,
            scoreList,
            element.response_frequency,
            element.aggregation_type
          );

          avgYtdValue = ytdkpireport.avgYtdValue;
          avgYtdScore = ytdkpireport.avgYtdScore;
          // avgYtdValue =
          //   scoreList.reduce((a, b) => +a + +b.ytdValue, 0) / scoreList.length;
          // avgYtdScore =
          //   scoreList.reduce((a, b) => +a + +b.score, 0) / scoreList.length;
        }

  

        // activities[idx].expiry_date = expiry_date;
        activities[idx].expiry_date = responseHeadList.endDate;
        activities[idx].scores = scoreList;
        activities[idx].avgYtdValue = avgYtdValue;
        activities[idx].avgYtdScore = avgYtdScore;
      }

      //KPI status check

      let currentDate = new Date();
      let filterfromDate =
        currentDate.getFullYear() +
        "-" +
        String(currentDate.getMonth() + 1).padStart(2, "0") +
        "-01";
      let filtertoDate =
        currentDate.getFullYear() +
        "-" +
        String(currentDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(currentDate.getDate()).padStart(2, "0");

      filterfromDate = helper.dateFormatUSA(filterfromDate);
      filtertoDate = helper.dateFormatUSA(filtertoDate);

      responseHeadList = await helper.getResponseHeadKPI(
        filterfromDate,
        filtertoDate,
        activities[idx].response_frequency,
        activities[idx].submission_day
      );

      responseHeadList = responseHeadList[responseHeadList.length - 1];
      let firstDate = helper.dateFormatUSA(responseHeadList.responseDate);
      let secondDate = helper.dateFormatUSA(responseHeadList.responseEndDate);
      let checkKpi = await db.sequelize.query(
        `SELECT kpi.id as kpiid, elem.* FROM storage_activity_kpi kpi right join storage_activity_kpi_elements elem on kpi.id = elem.storage_id 
          and responsedate between '${firstDate}' and '${secondDate}'  where  (kpi.admin_activity_id='${activities[idx].admin_activity_id}' || kpi.client_activity_id='${activities[idx].client_activity_id}') and kpi.organization_id=${req.organization_id} `,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      activities[idx].status = checkKpi.length ? "Completed" : "Pending";
      // activities[idx].expiry_date = secondDate;

      fromDate = req.query.fromDate;
      toDate = req.query.toDate;

      if (!fromDate && !toDate) {
        fromDate =
          today.getFullYear() + "-" + (today.getMonth()+1) + "-" + today.getDate();
        toDate =
          today.getFullYear() + "-" + (today.getMonth()+1) + "-" + today.getDate();
      }

      

      responseHeadList = await helper.getResponseHead(
        fromDate,
        toDate,
        activities[idx].response_frequency,
        activities[idx].submission_day
      );

      console.log("fromDate,toDate,",fromDate,
  toDate,responseHeadList);
      
 
      activities[idx].expiry_date = helper.dateFormatUSA(
        responseHeadList[responseHeadList.length - 1].responseEndDate
      );

      if(activities[idx].response_frequency=="Biannual") {
          responseHeadList = await helper.getStartAndEndDate(
          fromDate,
          toDate,
          activities[idx].response_frequency,
          activities[idx].submission_day
        );

        activities[idx].expiry_date = responseHeadList.endDate;
      }

      idx++;
    }

    return res.send(activities);
  }

  //console.log(where);
  kpis = await db.sequelize.query(sql);

  // console.log(kpis[0]);

  if (kpis.length > 0) {
    let i = 0;
    for (const kpi of kpis[0]) {
      elements = [];
      if (kpi.storage_id) {
        elements = await db.storage_activity_kpi_elements.findAll({
          where: {
            storage_id: kpi.storage_id,
          },
        });
      }

      kpis[0][i].elements = elements;
      i++;
      if (kpis[0].length == i) {
        res.send(kpis[0]);
      }
    }
  } else {
    res.send([]);
  }
};

exports.observationReport = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  var where = { status: { [Op.notIn]: [master.status.delete] } };

  if (req.role_id == 4) {
    // console.log('role id',req.role_id);
    var where = {
      status: { [Op.notIn]: [master.status.delete] },
      updator_id: req.userId,
    };
  }

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  //|| req.role_id == 5
  let userRoleConds = "";
  roleCond = " && p.role_id=4";
  if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
    userRoleConds = ` && user_id=${req.userId} `;
    roleCond = `  && p.role_id=${req.role_id}`;
  }

  let whereResDateCond = "";
  if (req.query.fromDate && req.query.toDate) {
    whereResDateCond = ` and responsedate between '${req.query.fromDate}' and '${req.query.toDate}' `;
  }

  if (
    req.role_id == 4 ||
    req.role_id == 5 ||
    req.role_id == 6 ||
    req.role_id == 2 ||
    req.role_id == 3
  ) {
    const sql = `
select  A.observation_name as activity,A.description, A.code,A.submission_day, A.response_frequency, A.observation_type, m.client_activity_id, m.admin_activity_id, b.id as storage_id,
      (case when b.id is null then 'Pending' else 'Completed' end) as status,
        c.name as libraryname, d.name as company_name, GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name) SEPARATOR '') as assignTo,
        A.kpi, b.expiry_date, b.currency as actualvalue,b.comments,
        m.id  as mappingid, A.type, m.client_activity_id as client_activity_id, m.admin_activity_id,b.createdAt as response_date,m.library_id  from activity_mapping m
left join admin_activities as A  on m.admin_activity_id = A.id  and A.type = 2 && A.kpi=0 && m.organization_id in (0,${req.organization_id})
left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id} ${roleCond}
left join storage_observation as b on A.id = b.admin_activity_id && b.organization_id=${req.organization_id} ${whereResDateCond}
left join libraries as c on m.library_id = c.id
left join organizations as d on d.id = ${req.organization_id}
left join users as e on e.id = p.user_id
where m.library_id in (select library_id from organization_libraries where organization_id = ${req.organization_id} and status = 1) ${userRoleConds} and A.type = 2  group by A.code, m.library_id  order by b.id desc
      `;

    const sqlOrganization = `
    select  A.observation_name as activity,A.description, A.code,A.submission_day, A.response_frequency, A.observation_type, m.client_activity_id, m.admin_activity_id, b.id as storage_id,
      (case when b.id is null then 'Pending' else 'Completed' end) as status,
        c.name as libraryname, d.name as company_name, GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name) SEPARATOR '') as assignTo,
        A.kpi, b.expiry_date, b.currency as actualvalue,b.comments,
        m.id  as mappingid, A.type, m.client_activity_id as client_activity_id, m.admin_activity_id,b.createdAt as response_date,m.library_id   from activity_mapping m
    left join activities_organization as A  on m.admin_activity_id = A.admin_activity_id  and A.organization_id = ${req.organization_id}   and A.type = 2 and kpi = 0 && m.organization_id in (0,${req.organization_id})
    left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id} ${roleCond}
    left join storage_observation as b on A.admin_activity_id = b.admin_activity_id && b.organization_id=${req.organization_id} ${whereResDateCond}
    left join libraries as c on m.library_id = c.id
    left join organizations as d on d.id = ${req.organization_id}
    left join users as e on e.id = p.user_id
    where m.library_id in (select library_id from organization_libraries where organization_id = ${req.organization_id} and status = 1) ${userRoleConds} and A.type = 2  group by A.code, m.library_id  order by b.id desc
      `;

    const clientsql = `
    select A.observation_name as activity,A.description, A.code,A.submission_day, A.response_frequency, A.observation_type, m.client_activity_id, m.admin_activity_id, b.id as storage_id,
      (case when b.id is null then 'Pending' else 'Completed' end) as status,
        c.name as libraryname, d.name as company_name, GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name) SEPARATOR '') as assignTo,
        A.kpi, b.expiry_date, b.currency as actualvalue,b.comments,
        m.id, A.type, A.id as client_activity_id, m.admin_activity_id,b.createdAt as response_date,m.library_id  from activity_mapping m
  left join client_admin_activities as A  on m.client_activity_id = A.id  and A.type = 2 && A.kpi=0 && m.organization_id in (0,${req.organization_id})
  left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id} ${roleCond}
  left join storage_observation as b on A.id = b.client_activity_id && b.organization_id=${req.organization_id} ${whereResDateCond}
  left join libraries as c on m.library_id = c.id
  left join organizations as d on d.id = ${req.organization_id}
  left join users as e on e.id = p.user_id
  where m.library_id in (select library_id from organization_libraries where organization_id = ${req.organization_id} and status = 1) ${userRoleConds} and A.type = 2  group by A.code, m.library_id  order by b.id desc
      `;

    // console.log(sql);

    let allactivities = [];
    const adminActivities = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    const OrgActivities = await db.sequelize.query(sqlOrganization, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    const clientActivities = await db.sequelize.query(clientsql, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    if (adminActivities.length > 0) {
      allactivities = [...allactivities];
    }
    if (OrgActivities.length > 0) {
      allactivities = [...allactivities, ...OrgActivities];
    }

    allactivities = helper.removeDuplicatesFromArrayObj(
      allactivities,
      "mappingid"
    );

    if (clientActivities.length > 0) {
      allactivities = allactivities.concat(clientActivities);
    }

    let activities = allactivities.filter(function (e) {
      return e.type == 2 && e.kpi == 0;
    });
    //console.log(adminActivities);

    activities.forEach((element, idx) => {
      // console.log(element.submission_day, element.response_frequency, element.response_date);
      expiry_date = getDueDate(
        element.submission_day,
        element.response_frequency,
        element.response_date
      );
      activities[idx].expiry_date = expiry_date;
    });

    const newOBSActivityArr = [];
    let fromDate = req.query.fromDate;
    let toDate = req.query.toDate;
    let today = new Date();
    if (!fromDate && !toDate) {
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
    }

    for (const activity of activities) {
      let responseHeadList = await helper.getResponseHead(
        fromDate,
        toDate,
        activity.response_frequency,
        activity.submission_day
      );

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

        let kpiStorageObj = {
          actualvalue: null,
          comments: "",
          response_date: null,
          status: "Pending",
        };
        if (storageDetails.length > 0) {
          kpiStorageObj = {
            actualvalue: storageDetails[0].currency,
            comments: storageDetails[0].comments,
            response_date: storageDetails[0].response_date,
            status: "Completed",
            expiry_date: responseHead.responseEndDate,
          };
        }

        newOBSActivityArr.push({
          ...activity,
          ...kpiStorageObj,
          response: responseHead.week,
          responseDate: responseHead.responseDate,
          responseEndDate: responseHead.responseEndDate,
          expiry_date: responseHead.responseEndDate,
        });
      }
    }

    return res.send(newOBSActivityArr);
  }
};

exports.surveyorcompareReport = async (req, res) => {
  //library_id = req.body.library_id;

  // let libraryCond = "";
  // if (library_id) {
  //   libraryCond = ` && library_id=${library_id} `;
  // }

  let library_id = null;
  let updator_id = null;
  let surveyor_internal_id = null;
  let surveyor_external_id = null;
  let substandard_id = null;
  let standard_id = null;
  let chapter_id = null;
  if (req.query.library_id) {
    library_id = req.query.library_id;
  }

  if (
    req.query.library_id == undefined ||
    req.query.library_id == "undefined"
  ) {
    library_id = null;
  }
  if (req.query.updator_id) {
    updator_id = req.query.updator_id;
  }
  if (req.query.surveyor_internal_id) {
    surveyor_internal_id = req.query.surveyor_internal_id;
  }
  if (req.query.surveyor_external_id) {
    surveyor_external_id = req.query.surveyor_external_id;
  }
  if (req.query.substandard_id) {
    substandard_id = req.query.substandard_id;
  }
  if (req.query.standard_id) {
    standard_id = req.query.standard_id;
  }
  if (req.query.chapter_id) {
    chapter_id = req.query.chapter_id;
  }

  let filterBy = null;
  let filterID = null;
  if (req.role_id == 4) {
    filterBy = "Updator";
    filterID = req.userId;
  } else if (req.role_id == 5) {
    filterBy = "Surveyor";
    filterID = req.userId;
  }

  const userDetail = await db.users.findOne({
    where: {
      id: req.userId,
    },
  });

  //console.log(req.userId);

  if (req.role_id == 4) {
    updator_id = req.userId;

    let updatorAssignedProps = await db.property_mapping
      .findAll({
        where: {
          user_id: req.userId,
          role_id: req.role_id,
        },
      })
      .then((props) =>
        props.filter((el) => el.status !== 2).map((el) => el.substandard_id)
      );

    let updatorSubstandardScore = await helper.getSubstandardScoreUpdatorSurv(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    if (isNaN(updatorSubstandardScore)) {
      updatorSubstandardScore = null;
    }

    let internalSurveyorSubstandardScore =
      await helper.getSubstandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_internal_id,
        1,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        updatorAssignedProps
      );

    if (isNaN(internalSurveyorSubstandardScore)) {
      internalSurveyorSubstandardScore = null;
    }

    let externalSurveyorSubstandardScore =
      await helper.getSubstandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_external_id,
        2,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        updatorAssignedProps
      );

    if (isNaN(externalSurveyorSubstandardScore)) {
      externalSurveyorSubstandardScore = null;
    }

    let updatorLibraryScore = await helper.getLibraryScoreUpdatorSurveyorComp(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    if (isNaN(updatorLibraryScore)) {
      updatorLibraryScore = null;
    }

    let internalSurveyorLibraryScore = await helper.getLibraryScoreSurveyorComp(
      req,
      library_id,
      surveyor_internal_id,
      1,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    if (isNaN(internalSurveyorLibraryScore)) {
      internalSurveyorLibraryScore = null;
    }

    let externalSurveyorLibraryScore = await helper.getLibraryScoreSurveyorComp(
      req,
      library_id,
      surveyor_external_id,
      2,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    if (isNaN(externalSurveyorLibraryScore)) {
      externalSurveyorLibraryScore = null;
    }

    let updatorStandardScore = await helper.getStandardScoreUpdatorSurv(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    let internalSurveyorStandardScore =
      await helper.getStandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_internal_id,
        1,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        updatorAssignedProps
      );

    let externalSurveyorStandardScore =
      await helper.getStandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_external_id,
        2,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        updatorAssignedProps
      );

    let updatorChapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    let internalSurveyorChapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      library_id,
      surveyor_internal_id,
      1,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    let externalSurveyorChapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      library_id,
      surveyor_external_id,
      2,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    sql = `
    select(${updatorLibraryScore}) as updatorscore_library,
      (${internalSurveyorLibraryScore}) as internalsurveyorscore_library,
      (${externalSurveyorLibraryScore}) as externalsurveyorscore_library,
      (${updatorChapterScore}) as updatorscore_chapter,
      (${internalSurveyorChapterScore}) as internalsurveyorscore_chapter,
      (${externalSurveyorChapterScore}) as externalsurveyorscore_chapter,
      (${updatorStandardScore}) as updatorscore_standard,
      (${internalSurveyorStandardScore}) as internalsurveyorscore_standard,
      (${externalSurveyorStandardScore}) as externalsurveyorscore_standard,
      (${updatorSubstandardScore}) as updatorscore_sub_standard,
      (${internalSurveyorSubstandardScore}) as internalsurveyorscore_sub_standard,
      (${externalSurveyorSubstandardScore}) as externalsurveyorscore_sub_standard`;

    surveyorComp = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    return res.send(surveyorComp);
  }
  if (req.role_id == 5) {
    surveyor_external_id = req.userId;
    if (userDetail.surveyor_type == 1) {
      surveyor_internal_id = req.userId;
    }

    let updatorAssignedProps = await db.property_mapping
      .findAll({
        where: {
          user_id: req.userId,
          role_id: req.role_id,
        },
      })
      .then((props) =>
        props.filter((el) => el.status !== 2).map((el) => el.substandard_id)
      );

    let updatorSubstandardScore = await helper.getSubstandardScoreUpdatorSurv(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    if (isNaN(updatorSubstandardScore)) {
      updatorSubstandardScore = null;
    }

    let internalSurveyorSubstandardScore =
      await helper.getSubstandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_internal_id,
        1,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        updatorAssignedProps
      );

    if (isNaN(internalSurveyorSubstandardScore)) {
      internalSurveyorSubstandardScore = null;
    }

    let externalSurveyorSubstandardScore =
      await helper.getSubstandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_external_id,
        2,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        updatorAssignedProps
      );

    if (isNaN(externalSurveyorSubstandardScore)) {
      externalSurveyorSubstandardScore = null;
    }

    let updatorLibraryScore = await helper.getLibraryScoreUpdatorSurveyorComp(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    if (isNaN(updatorLibraryScore)) {
      updatorLibraryScore = null;
    }

    // let internalSurveyorLibraryScore = await helper.getLibraryScoreSurveyorComp(
    //   req,
    //   library_id,
    //   surveyor_internal_id,
    //   1,
    //   null,
    //   chapter_id,
    //   standard_id,
    //   substandard_id,
    //   req.organization_id,
    //   null,
    //   null,
    //   updatorAssignedProps
    // );

    let internalSurveyorLibraryScore =
      await helper.getLibraryScoreUpdatorSurveyorComp(
        req,
        library_id,
        surveyor_internal_id,
        1,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        updatorAssignedProps
      );

    if (isNaN(internalSurveyorLibraryScore)) {
      internalSurveyorLibraryScore = null;
    }

    // let externalSurveyorLibraryScore = await helper.getLibraryScoreSurveyorComp(
    //   req,
    //   library_id,
    //   surveyor_external_id,
    //   2,
    //   null,
    //   chapter_id,
    //   standard_id,
    //   substandard_id,
    //   req.organization_id,
    //   null,
    //   null,
    //   updatorAssignedProps
    // );

    let externalSurveyorLibraryScore =
      await helper.getLibraryScoreUpdatorSurveyorComp(
        req,
        library_id,
        surveyor_external_id,
        2,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        updatorAssignedProps
      );

    if (isNaN(externalSurveyorLibraryScore)) {
      externalSurveyorLibraryScore = null;
    }

    let updatorStandardScore = await helper.getStandardScoreUpdatorSurv(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    let internalSurveyorStandardScore =
      await helper.getStandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_internal_id,
        1,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        updatorAssignedProps
      );

    let externalSurveyorStandardScore =
      await helper.getStandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_external_id,
        2,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        updatorAssignedProps
      );

    let updatorChapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    let internalSurveyorChapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      library_id,
      surveyor_internal_id,
      1,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    let externalSurveyorChapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      library_id,
      surveyor_external_id,
      2,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      updatorAssignedProps
    );

    sql = `
    select(${updatorLibraryScore}) as updatorscore_library,
      (${internalSurveyorLibraryScore}) as internalsurveyorscore_library,
      (${externalSurveyorLibraryScore}) as externalsurveyorscore_library,
      (${updatorChapterScore}) as updatorscore_chapter,
      (${internalSurveyorChapterScore}) as internalsurveyorscore_chapter,
      (${externalSurveyorChapterScore}) as externalsurveyorscore_chapter,
      (${updatorStandardScore}) as updatorscore_standard,
      (${internalSurveyorStandardScore}) as internalsurveyorscore_standard,
      (${externalSurveyorStandardScore}) as externalsurveyorscore_standard,
      (${updatorSubstandardScore}) as updatorscore_sub_standard,
      (${internalSurveyorSubstandardScore}) as internalsurveyorscore_sub_standard,
      (${externalSurveyorSubstandardScore}) as externalsurveyorscore_sub_standard`;

    surveyorComp = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    return res.send(surveyorComp);
  } else if (req.role_id == 2 || req.role_id == 3 || req.role_id == 6) {
    //find props
    let comparableArr = [];
    let filterUserIds = [];
    let assignedProps = [];
    if (updator_id) {
      filterUserIds.push(updator_id);
    }

    if (surveyor_internal_id) {
      filterUserIds.push(surveyor_internal_id);
    }

    if (surveyor_external_id) {
      filterUserIds.push(surveyor_external_id);
    }

    if (updator_id || surveyor_internal_id || surveyor_external_id) {
      const prop_mappings_all = await db.property_mapping.findAll({
        where: {
          organization_id: req.organization_id,
          user_id: {
            [Op.in]: filterUserIds,
          },
        },
        include: {
          model: db.users,
          as: "users",
          attributes: ["surveyor_type"],
          nested: false,
          required: true,
        },
        raw: true,
        logging: true,
      });

      let updatorProps = prop_mappings_all
        .filter((el) => el.role_id == 4)
        .map((el) => el.substandard_id);
      let intSurProps = prop_mappings_all
        .filter((el) => el.role_id == 5 && el["users.surveyor_type"] == 1)
        .map((el) => el.substandard_id);
      let extSurProps = prop_mappings_all
        .filter((el) => el.role_id == 5 && el["users.surveyor_type"] == 2)
        .map((el) => el.substandard_id);

      if (updatorProps.length > 0) {
        comparableArr.push(updatorProps);
      }
      if (intSurProps.length > 0) {
        comparableArr.push(intSurProps);
      }
      if (extSurProps.length > 0) {
        comparableArr.push(extSurProps);
      }

      if (comparableArr.length > 1) {
        assignedProps = helper.MultiArrayMatch(comparableArr);
      } else {
        assignedProps = [...comparableArr];
      }
    }

    let updatorSubstandardScore = await helper.getSubstandardScoreUpdatorSurv(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      filterBy,
      filterID
    );

    if (isNaN(updatorSubstandardScore)) {
      updatorSubstandardScore = null;
    }

    let internalSurveyorSubstandardScore =
      await helper.getSubstandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_internal_id,
        1,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        assignedProps
      );

    if (isNaN(internalSurveyorSubstandardScore)) {
      internalSurveyorSubstandardScore = null;
    }

    let externalSurveyorSubstandardScore =
      await helper.getSubstandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_external_id,
        2,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        assignedProps
      );

    // console.log(externalSurveyorSubstandardScore); return;

    if (isNaN(externalSurveyorSubstandardScore)) {
      externalSurveyorSubstandardScore = null;
    }

    let updatorLibraryScore = await helper.getLibraryScoreUpdatorSurveyorComp(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      assignedProps
    );

    if (isNaN(updatorLibraryScore)) {
      updatorLibraryScore = null;
    }

    let internalSurveyorLibraryScore = await helper.getLibraryScoreSurveyorComp(
      req,
      library_id,
      surveyor_internal_id,
      1,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      assignedProps
    );

    if (isNaN(internalSurveyorLibraryScore)) {
      internalSurveyorLibraryScore = null;
    }

    let externalSurveyorLibraryScore = await helper.getLibraryScoreSurveyorComp(
      req,
      library_id,
      surveyor_external_id,
      2,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      assignedProps
    );

    if (isNaN(externalSurveyorLibraryScore)) {
      externalSurveyorLibraryScore = null;
    }

    let updatorStandardScore = await helper.getStandardScoreUpdatorSurv(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      assignedProps
    );

    let internalSurveyorStandardScore =
      await helper.getStandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_internal_id,
        1,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        assignedProps
      );

    let externalSurveyorStandardScore =
      await helper.getStandardScoreUpdatorSurv(
        req,
        library_id,
        surveyor_external_id,
        2,
        null,
        chapter_id,
        standard_id,
        substandard_id,
        req.organization_id,
        null,
        null,
        assignedProps
      );

    let updatorChapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      library_id,
      updator_id,
      0,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      assignedProps
    );

    let internalSurveyorChapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      library_id,
      surveyor_internal_id,
      1,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      assignedProps
    );

    let externalSurveyorChapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      library_id,
      surveyor_external_id,
      2,
      null,
      chapter_id,
      standard_id,
      substandard_id,
      req.organization_id,
      null,
      null,
      assignedProps
    );

    sql = `
    select(${updatorLibraryScore}) as updatorscore_library,
      (${internalSurveyorLibraryScore}) as internalsurveyorscore_library,
      (${externalSurveyorLibraryScore}) as externalsurveyorscore_library,
      (${updatorChapterScore}) as updatorscore_chapter,
      (${internalSurveyorChapterScore}) as internalsurveyorscore_chapter,
      (${externalSurveyorChapterScore}) as externalsurveyorscore_chapter,
      (${updatorStandardScore}) as updatorscore_standard,
      (${internalSurveyorStandardScore}) as internalsurveyorscore_standard,
      (${externalSurveyorStandardScore}) as externalsurveyorscore_standard,
      (${updatorSubstandardScore}) as updatorscore_sub_standard,
      (${internalSurveyorSubstandardScore}) as internalsurveyorscore_sub_standard,
      (${externalSurveyorSubstandardScore}) as externalsurveyorscore_sub_standard`;

    surveyorComp = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    //library_id missing from frontend
    //updatorLibraryScore = await getLibraryScoreAll(req, library_id, null, 0);
    // internalSurvLibraryScore = await getLibraryScoreAll(
    //   req,
    //   library_id,
    //   null,
    //   1
    // );
    // externalSurvLibraryScore = await getLibraryScoreAll(
    //   req,
    //   library_id,
    //   null,
    //   2
    // ); eddd

    return res.send(surveyorComp);
  } else {
    var where = { status: { [Op.notIn]: [master.status.delete] } };

    if (
      req.headers["organization"] != undefined &&
      req.headers["organization"]
    ) {
      where.organization_id = req.headers["organization"];
    }
    db.score_mapping
      .findAll({
        attributes: [
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("updator_score")
            ),
            "updator",
          ],
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("internal_surveyor_score")
            ),
            "internalsurveyor",
          ],
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("external_surveyor_score")
            ),
            "externalsurveyor",
          ],
          [
            db.sequelize.fn("count", db.score_mapping.sequelize.col("id")),
            "count",
          ],
        ],

        where: where,
      })
      .then((data) => {
        if (data.length > 0) {
          data[0].dataValues.updator = (
            (data[0].dataValues.updator / (2 * data[0].dataValues.count)) *
            100
          ).toFixed(2);
          data[0].dataValues.internalsurveyor = (
            (data[0].dataValues.internalsurveyor /
              (2 * data[0].dataValues.count)) *
            100
          ).toFixed(2);
          data[0].dataValues.externalsurveyor = (
            (data[0].dataValues.externalsurveyor /
              (2 * data[0].dataValues.count)) *
            100
          ).toFixed(2);
        }
        res.send(data);
      });
  }
};

exports.propertyAssign = async (req, res) => {
  if (req.role_id == 2 || req.role_id == 3) {
    let assignedLibraries = null;

    let assignedLibs = await db.organization_libraries
      .findAll({
        where: {
          organization_id: req.organization_id,
          status: 1,
        },
        group: ["library_id"],
      })
      .then((result) => {
        if (result.length > 0) {
          return result.map((el) => el.library_id);
        }
        return [];
      });

    if (assignedLibs.length > 0) {
      assignedLibraries = "'" + assignedLibs.join("','") + "'";
    }

    let substandard = ` (select * from sub_standards where id in (select substandard_id from  activity_mapping where library_id in (${assignedLibraries})  group by substandard_id))`;

    let sql = ` select A.id, D.name as libraryname, C.name as chaptername, B.name as stadardname, A.name as substandardname,
    F.user_id as updator_id,
    (select name from users where id = F.user_id && status != 2 ) as updatorname,
      G.user_id as surveyor_id,
      (select name from users where id = G.user_id && status != 2 ) as surveyorname
    from ${substandard} as A
    inner join standards as B on A.standard_id = B.id
    inner join chapters as C on B.chapter_id = C.id
    inner join libraries as D on C.library_id = D.id 
    inner join organization_libraries as E on D.id = E.library_id &&  organization_id=${req.organization_id}
    left join (select * from property_mapping where  organization_id=${req.organization_id} && role_id=4  && library_id in (${assignedLibraries}) group by  substandard_id)  as F on A.id = F.substandard_id
    left join  (select * from property_mapping where organization_id=${req.organization_id} && role_id=5  && library_id in (${assignedLibraries}) group by  substandard_id) as G on A.id = G.substandard_id
    where E.organization_id = ${req.headers["organization"]} group by A.id, C.library_id
    `;

    substandardList = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    return res.send(substandardList);
  }

  var where = { status: { [Op.notIn]: [master.status.delete] } };

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }
  db.property_mapping
    .findAll({
      include: [
        // { model: db.users, as: 'users', attributes: ['name', 'email','role_id'],include:[{ model: db.roles, as: 'roles', attributes: ['role_name'],nested: false,required: true,}]},
        { model: db.libraries, as: "library", attributes: ["code", "name"] },
        { model: db.chapters, as: "chapter", attributes: ["code", "name"] },
        { model: db.standards, as: "standard", attributes: ["code", "name"] },
        {
          model: db.sub_standards,
          as: "substandard",
          attributes: ["code", "name"],
        },
      ],
      where: where,
      group: ["library_id", "chapter_id", "standard_id", "substandard_id"],
    })
    .then(async (data) => {
      if (data.length > 0) {
        var details = [];
        data.forEach(async (element, key) => {
          data[key].dataValues.assigning = await db.property_mapping.findAll({
            where: {
              library_id: element.library_id,
              chapter_id: element.chapter_id,
              standard_id: element.standard_id,
              substandard_id: element.substandard_id,
            },
            attributes: [],
            include: [
              {
                model: db.users,
                as: "users",
                attributes: ["name", "email", "role_id"],
                include: [
                  {
                    model: db.roles,
                    as: "roles",
                    attributes: ["role_name"],
                    nested: false,
                    required: true,
                  },
                ],
              },
            ],
          });
          //    console.log(data.length,userget);
          if (data.length == key + 1) {
            res.send(data);
          }
        });
      } else {
        res.send(data);
      }
    });
};

exports.doucments = async (req, res) => {
  var where = { status: { [Op.notIn]: [master.status.delete] } };

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }
  if (req.query.from) {
    where.response_date = {
      [Op.gte]: req.query.from,
    };
  }
  if (req.query.to) {
    where.response_date = {
      [Op.lte]: req.query.from,
    };
  }

  if (req.query.type == 1) {
    db.storage_activity_checklist
      .findAll({
        attributes: [
          "id",
          "organization_id",
          "mapping_id",
          "response_frequency",
          "response_date",
          "file_status",
          "status",
          "createdAt",
          "file_no",
          "file_status",
        ],
        where: where,
        include: [
          {
            model: db.storage_activity_checklist_elements,
            as: "element",
          },
          { model: db.organizations, as: "organizationScoreJoin" },
          { model: db.users, as: "userDetail", attributes: ["name", "email"] },
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
        if (data.length > 0) {
          data.forEach(async (element, key) => {
            data[key].dataValues.library = await db.activity_mapping.findAll({
              attributes: ["libraries_mapping.code", "libraries_mapping.name"],
              where: { id: element.mapping_id },
              include: [
                {
                  model: db.libraries,
                  as: "libraries_mapping",
                  attributes: [],
                },
              ],
              raw: true,
            });
            if (data.length == key + 1) {
              res.send(data);
            }
          });
        } else {
          res.send(data);
        }
      });
  } else {
    db.storage_activity_document
      .findAll({
        group: ["updator_id", "mapping_id"],
        attributes: [
          "id",
          "organization_id",
          "mapping_id",
          [
            db.sequelize.fn(
              "count",
              db.storage_activity_document.sequelize.col("mapping_id")
            ),
            "averagecount",
          ],
          "expiry_date",
          "createdAt",
          "document_link",
        ],
        where: where,
        include: [
          { model: db.organizations, as: "organizationScoreJoin" },
          { model: db.users, as: "userDetail", attributes: ["name", "email"] },
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
        //console.log(111,data);
        if (data.length > 0) {
          data.forEach(async (element, key) => {
            data[key].dataValues.library = await db.activity_mapping.findAll({
              attributes: ["libraries_mapping.code", "libraries_mapping.name"],
              where: { id: element.mapping_id },
              include: [
                {
                  model: db.libraries,
                  as: "libraries_mapping",
                  attributes: [],
                },
              ],
              raw: true,
            });
            if (data.length == key + 1) {
              res.send(data);
            }
          });
        } else {
          res.send(data);
        }
      });
  }
};

exports.documentReport = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  var where = { status: { [Op.notIn]: [master.status.delete] } };

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  //console.log(where);

  db.storage_activity_document
    .findAll({
      where: where,
      include: [
        { model: db.organizations, as: "organizationScoreJoin" },
        { model: db.users, as: "userDetail", attributes: ["name", "email"] },
        {
          model: db.admin_activities,
          as: "adminActivityDetail",
          attributes: [
            "id",
            "type",
            "name",
            "code",
            "assign_dummy",
            "element_dummy",
          ],
        },
        {
          model: db.client_admin_activities,
          as: "clientActivityDetail",
          attributes: [
            "id",
            "type",
            "name",
            "code",
            "assign_dummy",
            "element_dummy",
          ],
        },
      ],
    })
    .then(async (data) => {
      if (data.length > 0) {
        data.forEach(async (element, key) => {
          data[key].dataValues.library = await db.activity_mapping.findAll({
            attributes: [
              "libraries_mapping.id",
              "libraries_mapping.code",
              "libraries_mapping.name",
            ],
            where: { id: element.mapping_id },
            include: [
              { model: db.libraries, as: "libraries_mapping", attributes: [] },
            ],
            raw: true,
          });

          if (data[key].dataValues.adminActivityDetail) {
            data[key].dataValues.assign = await db.activity_mapping.findAll({
              where: {
                admin_activity_id: element.mapping_id,
                organization_id: { [Op.in]: [org_id, 0] },
              },
              include: [
                {
                  model: db.sub_standards,
                  as: "sub_standards_mapping",
                },
              ],
            });
          } else {
            data[key].dataValues.assign = await db.activity_mapping.findAll({
              where: {
                client_activity_id: element.mapping_id,
                organization_id: { [Op.in]: [org_id, 0] },
              },
              include: [
                {
                  model: db.sub_standards,
                  as: "sub_standards_mapping",
                },
                {
                  model: db.standards,
                  as: "standards_mapping",
                },
              ],
            });
          }

          if (data.length == key + 1) {
            res.send(data);
          }
        });
      } else {
        res.send(data);
      }
    });
};
// db.users.findAll({
//     where:where,
//     attributes: {
//         exclude: ['password', 'temporary_password', 'jwt', 'otp']
//     },
//     include: [
//         { model: db.surveyor_categories, as: 'categorydetailsJoin' },
//     ],
//     order: [
//         ['id', 'DESC']
//     ]
// }).then(data => res.send(data))

// maxi =100

exports.surveyorAssessment = async (req, res) => {
  var where = { status: { [Op.notIn]: [master.status.delete] } };

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }
  //console.log("111111",where)

  try {
    db.score_mapping
      .findAll({
        group: ["library_id", "internal_surveyor_id", "external_surveyor_id"],
        attributes: [
          "id",
          [
            db.sequelize.fn(
              "AVG",
              db.score_mapping.sequelize.col("internal_surveyor_score")
            ),
            "InternalSurveyorScore",
          ],
          [
            db.sequelize.fn(
              "AVG",
              db.score_mapping.sequelize.col("external_surveyor_score")
            ),
            "ExternalSurveyorScore",
          ],
        ],
        where: where,
        include: [
          { model: db.organizations, as: "organizationScoreJoin" },
          { model: db.libraries, as: "libraryJoin" },
          {
            model: db.users,
            as: "internalSurveyorJoin",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
          },
          {
            model: db.users,
            as: "externalSurveyorJoin",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
          },
        ],
      })
      .then((data) => {
        //console.log("111111")
        res.send(data);
      });
  } catch (error) {
    res.send({ error: error });
  }
};
