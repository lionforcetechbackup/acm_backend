const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const { where } = require("sequelize");
const helper = require("../util/helper");
exports.create = async (req, res) => {
  let where = { substanard_id: req.body.substanard_id };

  if (req.role_id === 4) {
    where.updator_id = req.userId;
  }
  if (
    req.body.updator_score &&
    (req.body.updator_score === -1 || req.body.updator_score === "NA")
  ) {
    req.body.updator_score = null;
  }

  if (
    req.body.internal_surveyor_score &&
    (req.body.internal_surveyor_score === -1 ||
      req.body.internal_surveyor_score === "NA")
  ) {
    req.body.internal_surveyor_score = null;
  }

  if (
    req.body.external_surveyor_score &&
    (req.body.external_surveyor_score === -1 ||
      req.body.external_surveyor_score === "NA")
  ) {
    req.body.external_surveyor_score = null;
  }
  if (req.role_id === 5) {
    let data = await db.sequelize.query(
      `select * from user_role_company where user_id=${req.userId} and role_id=5`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (data && data.length > 0) {
      if (data[0].surveyor_type === 2) {
        where.external_surveyor_id = req.userId;
      } else {
        where.internal_surveyor_id = req.userId;
      }
    } else {
      where.internal_surveyor_id = req.userId;
    }
  }

  try {
    db.score_mapping
      .upsert(
        {
          organization_id: req.body.organization_id,
          library_id: req.body.library_id,
          chapter_id: req.body.chapter_id,
          standard_id: req.body.standard_id,
          substanard_id: req.body.substanard_id,
          updator_id: req.body.updator_id,
          internal_surveyor_id: req.body.internal_surveyor_id,
          external_surveyor_id: req.body.external_surveyor_id,
          updator_score: req.body.updator_score,
          internal_surveyor_score: req.body.internal_surveyor_score,
          external_surveyor_score: req.body.external_surveyor_score,
          updator_comment: req.body.updator_comment,
          internal_surveyor_comment: req.body.internal_surveyor_comment,
          external_surveyor_comment: req.body.external_surveyor_comment,
          status: master.status.active,
        },
        {
          where: where,
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "score_mapping",
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
exports.update = async (req, res) => {
  if (
    req.body.updator_score &&
    (req.body.updator_score === -1 || req.body.updator_score === "NA")
  ) {
    req.body.updator_score = null;
  }

  if (
    req.body.internal_surveyor_score &&
    (req.body.internal_surveyor_score === -1 ||
      req.body.internal_surveyor_score === "NA")
  ) {
    req.body.internal_surveyor_score = null;
  }

  if (
    req.body.external_surveyor_score &&
    (req.body.external_surveyor_score === -1 ||
      req.body.external_surveyor_score === "NA")
  ) {
    req.body.external_surveyor_score = null;
  }
  try {
    db.score_mapping
      .update(
        {
          organization_id: req.body.organization_id,
          library_id: req.body.library_id,
          chapter_id: req.body.chapter_id,
          standard_id: req.body.standard_id,
          substanard_id: req.body.substanard_id,
          updator_id: req.body.updator_id,
          internal_surveyor_id: req.body.internal_surveyor_id,
          external_surveyor_id: req.body.external_surveyor_id,
          updator_score: req.body.updator_score,
          internal_surveyor_score: req.body.internal_surveyor_score,
          external_surveyor_score: req.body.external_surveyor_score,
          updator_comment: req.body.updator_comment,
          internal_surveyor_comment: req.body.internal_surveyor_comment,
          external_surveyor_comment: req.body.external_surveyor_comment,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "score_mapping",
          primary_id: req.body.id,
          event: "update",
          new_value: req.body,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("updated");
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

exports.get = async (req, res) => {
  try {
    db.score_mapping
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
        },
        order: [["id", "DESC"]],
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
    db.score_mapping
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
  //db.score_mapping.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.score_mapping
      .update(
        {
          status: master.status.delete,
        },
        {
          where: { id: req.params.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "score_mapping",
          primary_id: data.id,
          event: "delete",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
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
    db.score_mapping
      .update(
        {
          status: req.params.status,
        },
        {
          where: { id: req.params.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "score_mapping",
          primary_id: data.id,
          event: "delete",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("status changed");
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

exports.updatorScore = async (req, res) => {
  //console.log(req.query.organization_id);
  try {
    let updatorScores = await db.score_mapping.findAll({
      attributes: [
        "updatorJoin.*",
        "libraryJoin.*",
        "organizationScoreJoin.*",
        // [
        //   Sequelize.literal("ROUND(((AVG(updator_score)/2) * 100 ),2)"),
        //   "updator_score_all",
        // ],
        [
          Sequelize.literal(
            "ROUND(((AVG(internal_surveyor_score)/2) * 100 ),2)"
          ),
          "internal_surveyor_score_all",
        ],
        [
          Sequelize.literal(
            "ROUND(((AVG(external_surveyor_score)/2) * 100 ),2)"
          ),
          "external_surveyor_score",
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
          attributes: [
            "id",
            "name",
            "role_id",
            "organization_id",
            "status",
            "email",
          ],
        },
        { model: db.libraries, as: "libraryJoin" },
        {
          model: db.organizations,
          as: "organizationScoreJoin",
          attributes: ["id", "name"],
        },
      ],
      where: {
        organization_id: { [Op.in]: [req.query.organization_id] },
        status: { [Op.notIn]: [master.status.delete] },
        updator_id: {
          [Op.ne]: null,
        },
      },
      order: [["id", "DESC"]],
      group: ["updator_id", "library_id"],
    });
    let scores = [];
    if (req.role_id == 6) {
      for (const element of updatorScores) {
        // console.log(element.externalSurveyorJoin.id);
        let checkSql = await db.sequelize.query(
          `select * from property_mapping where user_id=${element.updatorJoin.id} 
        and substandard_id in (select substandard_id from property_mapping where user_id=${req.userId} and role_id=6) `,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        // console.log(checkSql.length);
        if (checkSql.length > 0) {
          scores.push(element);
        }
      }
    } else {
      scores = [...updatorScores];
    }

    if (scores && scores.length > 0) {
      let updatorScoreIdx = 0;
      for (const score of scores) {
        library_id = score.libraryJoin.id;

        //  console.log("hi");
        let updatorScore = await getLibraryScoreUpdator(
          req,
          library_id,
          score.updatorJoin.id,
          0
        );

        if (updatorScore) {
          scores[updatorScoreIdx].dataValues.updator_score_all = updatorScore;
        } else {
          scores[updatorScoreIdx].dataValues.updator_score_all = null;
        }
        if (scores.length == updatorScoreIdx + 1) {
          return res.send(scores);
        }
        updatorScoreIdx = updatorScoreIdx + 1;
      }
    } else {
      return res.send(scores);
    }
  } catch (error) {
    console.log(error);
    logger.info("/error", error);
    res.send(error);
  }
};
exports.internalSurveyorScores = async (req, res) => {
  try {
    await db.score_mapping
      .findAll({
        attributes: [
          "internalSurveyorJoin.*",
          "libraryJoin.*",
          "organizationScoreJoin.*",
          [
            Sequelize.literal("ROUND(((AVG(updator_score)/2) * 100 ),2)"),
            "updator_score_all",
          ],

          [
            Sequelize.literal(
              "ROUND(((AVG(internal_surveyor_score)/2) * 100 ),2)"
            ),
            "internal_surveyor_score_all",
          ],
          [
            Sequelize.literal(
              "ROUND(((AVG(external_surveyor_score)/2) * 100 ),2)"
            ),
            "external_surveyor_score",
          ],

          [
            db.sequelize.fn(
              "count",
              db.score_mapping.sequelize.col("internal_surveyor_score")
            ),
            "count",
          ],
        ],
        include: [
          {
            model: db.users,
            as: "internalSurveyorJoin",
            attributes: [
              "id",
              "email",
              "name",
              "role_id",
              "organization_id",
              "status",
            ],
            include: [
              {
                model: db.surveyor_categories,
                as: "categorydetailsJoin",
              },
            ],
          },
          { model: db.libraries, as: "libraryJoin" },
          {
            model: db.organizations,
            as: "organizationScoreJoin",
            attributes: ["id", "name"],
          },
        ],
        where: {
          organization_id: { [Op.in]: [req.query.organization_id] },
          status: { [Op.notIn]: [master.status.delete] },
          internal_surveyor_id: {
            [Op.ne]: null,
          },
        },
        group: ["internal_surveyor_id"],
        order: [["id", "DESC"]],
      })
      .then(async (resData) => {
        let insertnalSurveyorScoreData = [];
        if (req.role_id == 6) {
          for (const element of resData) {
            let checkSql = await db.sequelize.query(
              `select * from property_mapping where user_id=${element.internalSurveyorJoin.id} 
              and substandard_id in (select substandard_id from property_mapping where user_id=${req.userId} and role_id=6) `,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            // console.log(checkSql.length);
            if (checkSql.length > 0) {
              insertnalSurveyorScoreData.push(element);
            }
          }
        } else {
          insertnalSurveyorScoreData = [...resData];
        }

        if (insertnalSurveyorScoreData.length > 0) {
          let internalSurveyorScoreIdx = 0;
          for (const element of insertnalSurveyorScoreData) {
            // if (!insertnalSurveyorScoreData[0].dataValues.internal_surveyor_score_all) {
            //   return res.send([]);
            // }
            if (insertnalSurveyorScoreData[internalSurveyorScoreIdx]) {
              insertnalSurveyorScoreData[
                internalSurveyorScoreIdx
              ].dataValues.updatorJoin = null;
              let score = await getLibraryScoreSurveyor(
                req,
                insertnalSurveyorScoreData[internalSurveyorScoreIdx].libraryJoin
                  .id,
                insertnalSurveyorScoreData[internalSurveyorScoreIdx]
                  .internalSurveyorJoin.id,
                1
              );
              insertnalSurveyorScoreData[
                internalSurveyorScoreIdx
              ].dataValues.internal_surveyor_score_all = score;
            }
            if (
              insertnalSurveyorScoreData.length ==
              internalSurveyorScoreIdx + 1
            ) {
              return res.send(insertnalSurveyorScoreData);
            }
            internalSurveyorScoreIdx++;
          }
        } else {
          insertnalSurveyorScoreData = [];
          return res.send(insertnalSurveyorScoreData);
        }
      })
      .catch((error) => {
        console.log(error);
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    return res.send(error);
  }
};
exports.externalSurveyorScores = async (req, res) => {
  try {
    await db.score_mapping
      .findAll({
        attributes: [
          "externalSurveyorJoin.*",
          "libraryJoin.*",
          "organizationScoreJoin.*",
          [
            Sequelize.literal("ROUND(((AVG(updator_score)/2) * 100 ),2)"),
            "updator_score_all",
          ],
          [
            Sequelize.literal(
              "ROUND(((AVG(internal_surveyor_score)/2) * 100 ),2)"
            ),
            "internal_surveyor_score_all",
          ],
          [
            Sequelize.literal(
              "ROUND(((AVG(external_surveyor_score)/2) * 100 ),2)"
            ),
            "external_surveyor_score",
          ],
          [
            db.sequelize.fn(
              "count",
              db.score_mapping.sequelize.col("external_surveyor_score")
            ),
            "count",
          ],
        ],
        include: [
          {
            model: db.users,
            as: "externalSurveyorJoin",
            attributes: [
              "id",
              "name",
              "email",
              "role_id",
              "organization_id",
              "status",
            ],
            include: [
              {
                model: db.surveyor_categories,
                as: "categorydetailsJoin",
              },
            ],
          },
          { model: db.libraries, as: "libraryJoin" },
          {
            model: db.organizations,
            as: "organizationScoreJoin",
            attributes: ["id", "name"],
          },
        ],
        where: {
          organization_id: { [Op.in]: [req.query.organization_id] },
          status: { [Op.notIn]: [master.status.delete] },
          external_surveyor_score: {
            [Op.ne]: null,
          },
        },
        order: [["id", "DESC"]],
      })
      .then(async (resData) => {
        // console.log(data);
        let data = [];

        if (req.role_id == 6) {
          for (const element of resData) {
            // console.log(element.externalSurveyorJoin.id);
            let checkSql = await db.sequelize.query(
              `select * from property_mapping where user_id=${element.externalSurveyorJoin.id} 
            and substandard_id in (select substandard_id from property_mapping where user_id=${req.userId} and role_id=6) `,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            // console.log(checkSql.length);
            if (checkSql.length > 0) {
              data.push(element);
            }
          }
        } else {
          data = [...resData];
        }

        if (data.length > 0) {
          if (!data[0].dataValues.external_surveyor_score) {
            return res.send([]);
          }
          data[0].dataValues.updatorJoin = null;
          let score = await getLibraryScoreSurveyor(
            req,
            data[0].libraryJoin.id,
            data[0].externalSurveyorJoin.id,
            2
          );
          data[0].dataValues.external_surveyor_score_all = score;
          return res.send(data);
        } else {
          data = [];
          return res.send(data);
        }
      })
      .catch((error) => {
        console.log(error);
        logger.info("/error", error);
        return res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    return res.send(error);
  }
};

getLibraryScoreUpdator = async (req, library_id, user_id, usertype = 0) => {
  // usertype : 0 updator, 1 internal surveyor, 2 external surveyor

  if (usertype == 0) {
    // let sql = `select ROUND(avg(chpupdatorscore),2) as score  from
    // (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from
    // (select *,avg(updator_score * 50) as newupdator_score from
    // ( select * from score_mapping where organization_id=${req.organization_id} && updator_score >=0  && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id}
    //   && user_id=${user_id} )  group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
    // as libscore where library_id=${library_id} group by library_id`;

    let property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${library_id} && user_id=${user_id}  && role_id=4  && (status is null || status=1)  group by substandard_id `;
    let score_mapping = ` select * from score_mapping where organization_id=${req.organization_id} && updator_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
    let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

    let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
    (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
    (select *,avg(updator_score * 50) as newupdator_score from 
    ( 
      select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.updator_score is null then 0 else B.updator_score end ) >=0  
     ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
    as libscore where library_id=${library_id} group by library_id`;

    // console.log(sql);

    const libScore = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (libScore.length > 0) {
      return libScore[0].score;
    }
  }

  return null;
  /*let cond = "    and pm.role_id=4 ";
  if (usertype == 0) {
    cond = `  and pm.role_id=4 `;
  }

  sql = `select chp.*  
  from property_mapping pm INNER join chapters chp on pm.chapter_id = chp.id 
  LEFT JOIN score_mapping score on chp.id = score.chapter_id and
  score.organization_id=${req.organization_id}
  where pm.organization_id=${req.organization_id} and chp.status not in (2) and pm.library_id=${library_id} and pm.user_id=${user_id} 
    ${cond}  group by chp.id
  `;

  //console.log(sql);
  //console.log('....');

  assignedChapters = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  //console.log(assignedChapters.length);

  newChaptersScore = [];
  for (const chapter of assignedChapters) {
    if (usertype == 0) {
      sqlsc = `select (select avg(updator_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and updator_id=${user_id} and standard_id=A.standard_id) as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${library_id} and 
      chapter_id='${chapter.id}' and updator_id=${user_id} 
      group by standard_id order by substanard_id desc`;
    }

    // console.log(sqlsc);
    userScore = [];

    newUserScore = await db.sequelize.query(sqlsc, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (newUserScore.length > 0) {
      score =
        newUserScore.map((el) => +el.newscore).reduce((a, b) => a + b, 0) /
        newUserScore.length;

      newChaptersScore.push(score.toFixed(2));
    }
  }

  //console.log('chapterscore' + newChaptersScore);

  if (newChaptersScore.length > 0) {
    score =
      newChaptersScore.map((el) => +el).reduce((a, b) => a + b, 0) /
      newChaptersScore.length;

    //console.log(score);

    return score;
  } else {
    return "";
  } */
};

getLibraryScoreSurveyor = async (
  req,
  library_id,
  user_id,
  usertype = 0,
  session_class_id = null
) => {
  // usertype : 0 updator, 1 internal surveyor, 2 external surveyor

  let cond = "    and pm.role_id=4 ";
  if (usertype == 0) {
    cond = `  and pm.role_id=4 `;

    let property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${library_id} && user_id=${user_id}  && role_id=4  && (status is null || status=1)  group by substandard_id `;
    let score_mapping = ` select * from score_mapping where organization_id=${req.organization_id} && updator_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
    let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

    let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
    (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
    (select *,avg(updator_score * 50) as newupdator_score from 
    ( 
      select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.updator_score is null then 0 else B.updator_score end ) >=0  
     ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
    as libscore where library_id=${library_id} group by library_id`;

    // let sql = `select ROUND(avg(chpupdatorscore),2) as score  from
    // (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from
    // (select *,avg(updator_score * 50) as newupdator_score from
    // ( select * from score_mapping where organization_id=${req.organization_id} && updator_score >=0  && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id}
    //   && user_id=${user_id} )  group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
    // as libscore where library_id=${library_id} group by library_id`;
    // console.log(getLibraryScoreUpdator);
    const libScore = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (libScore.length > 0) {
      return libScore[0].score;
    }
  }

  if (usertype > 0) {
    cond = `  and pm.role_id=5 `;

    let sessionSubQuery = "";
    if (session_class_id && session_class_id != undefined) {
      sessionSubQuery = ` and substandard_id in (select id from sub_standards where session_class_id like'%${session_class_id}%' )`;
    }

    if (usertype == 1) {
      let property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${library_id} && user_id=${user_id} ${sessionSubQuery}  && role_id=5  && (status is null || status=1)  group by substandard_id `;
      let score_mapping = ` select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
      let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) as internal_surveyor_score,B.external_surveyor_score `;

      let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
    (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
    (select *,avg(internal_surveyor_score * 50) as newupdator_score from 
    ( 
      select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0  
     ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
    as libscore where library_id=${library_id} group by library_id`;

      // let sql = `select ROUND(avg(chpupdatorscore),2) as score  from
      // (select  ROUND(avg(newinternal_surveyor_score),2) as chpupdatorscore,library_id from
      // (select *,avg(internal_surveyor_score * 50) as newinternal_surveyor_score from
      // ( select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score >=0
      //   && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id}
      //   && user_id=${user_id} ) ${sessionSubQuery}  group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
      // as libscore where library_id=${library_id} group by library_id`;
      // console.log(getLibraryScoreUpdator);

      const libScore = await db.sequelize.query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (libScore.length > 0) {
        return libScore[0].score;
      }
    } else {
      let property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${library_id} && user_id=${user_id} ${sessionSubQuery}  && role_id=5  && (status is null || status=1)  group by substandard_id `;
      let score_mapping = ` select * from score_mapping where organization_id=${req.organization_id} && external_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
      let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) as external_surveyor_score `;

      let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
    (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
    (select *,avg(external_surveyor_score * 50) as newupdator_score from 
    ( 
      select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) >=0  
     ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
    as libscore where library_id=${library_id} group by library_id`;

      // let sql = `select ROUND(avg(chpupdatorscore),2) as score  from
      // (select  ROUND(avg(newexternal_surveyor_score),2) as chpupdatorscore,library_id from
      // (select *,avg(external_surveyor_score * 50) as newexternal_surveyor_score from
      // ( select * from score_mapping where organization_id=${req.organization_id} && external_surveyor_score >=0  && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id}
      //   && user_id=${user_id} ) ${sessionSubQuery}   group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
      // as libscore where library_id=${library_id} group by library_id`;
      // console.log(getLibraryScoreUpdator);
      const libScore = await db.sequelize.query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (libScore.length > 0) {
        return libScore[0].score;
      }
    }
  }
  return null;

  /*
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

  */
};

exports.libraryScores = async (req, res) => {
  let assigned_user_id = req.userId;
  var where = {
    status: { [Op.notIn]: [master.status.delete] },
    organization_id: { [Op.in]: [req.query.organization_id] },
  };
  if (req.query.library_id) {
    where.library_id = req.query.library_id;
  }

  let updator_id = req.query.assigned_user_id;
  let assigned_role_id = req.query.assigned_role_id;
  if (req.query.assigned_user_id) {
    assigned_user_id = req.query.assigned_user_id;
  }

  // user = await db.users.findOne({
  //   where: {
  //     id: req.userId,
  //   },
  // });

  console.log("scoring...");

  const assignedUser = await db.users.findOne({
    where: {
      id: assigned_user_id,
    },
  });

  try {
    const librarydata = await db.organization_libraries.findAll({
      where,
      attributes: ["libraries.*"],
      include: [
        {
          model: db.libraries,
          as: "libraries",
          attributes: [],
          nested: false,
          required: true,
        },
      ],
      raw: true,
      group: ["id"],
      order: [["id", "DESC"]],
    });
    let score = null;
    if (librarydata.length > 0) {
      if (assigned_role_id == 5 || assignedUser.role_id == 5) {
        score = await getLibraryScoreSurveyor(
          req,
          req.query.library_id,
          assigned_user_id,
          assignedUser.surveyor_type,
          req.query.session_class_id
        );
      } else {
        score = await getLibraryScoreUpdator(
          req,
          req.query.library_id,
          assigned_user_id
        );
      }

      //surveyorScore = await getLibraryScore(req, req.query.library_id, updator_id);

      librarydata[0].library_updator_score = score;
      librarydata[0].updator_score = score;
      librarydata[0].surveyor_type = assignedUser
        ? assignedUser.surveyor_type
        : null;
      librarydata[0].external_surveyor_score = score;
      librarydata[0].internal_surveyor_score = score;
      librarydata[0].library_external_surveyor_score = score;
      librarydata[0].library_internal_surveyor_score = score;
    }

    res.send(librarydata);
    /*.then(async (librarydata) => {
         
           if (librarydata.length > 0) {
          updatorcond = "";
          if (updator_id) {
            updatorcond = ` and updator_id=${updator_id}`;
          }
          for (let index = 0; index < librarydata.length; index++) {
            var element = librarydata[index];
            // console.log(element.id)

            libraryScores = await db.sequelize.query(
              `select 
              (select avg(updator_score * 50) from score_mapping where organization_id='${req.query.organization_id}' &&  library_id='${element.id}' ${updatorcond} && updator_score >=0 && status !='${master.status.delete}') as library_updator_score,
              (select avg(internal_surveyor_score * 50) from score_mapping where organization_id='${req.query.organization_id}' &&  library_id='${element.id}' && internal_surveyor_score >=0 && status !='${master.status.delete}') as library_internal_surveyor_score,
              (select avg(external_surveyor_score * 50) from score_mapping where organization_id='${req.query.organization_id}' &&  library_id='${element.id}' && external_surveyor_score >=0 && status !='${master.status.delete}') as library_external_surveyor_score  
              from score_mapping limit 1`,
              {
                type: db.sequelize.QueryTypes.SELECT,
                raw: true,
              }
            );

            if (libraryScores.length > 0) {
              libraryUpdatorScores = +libraryScores[0].library_updator_score;
              libraryInternalSurveyorScore =
                +libraryScores[0].library_internal_surveyor_score;
              libraryexternalSurveyorScore =
                +libraryScores[0].library_external_surveyor_score;
            }

            var score = await db.score_mapping.findAll({
              where: {
                organization_id: { [Op.in]: [req.query.organization_id] },
                status: { [Op.notIn]: [master.status.delete] },
                library_id: element.id,
              },
            });
            if (score.length > 0) {
              // ====
              var array = [];
              //console.log(score.length);
              for (let index1 = 0; index1 < score.length; index1++) {
                const element1 = score[index1];
                var find = await array.find(
                  (element2) => element2.library_id == element.id
                );
                if (find) {
                  if (find.dataValues.updator_score) {
                    find.dataValues.updator_score =
                      (find.dataValues.updator_score + element1.updator_score) /
                      4;
                  }

                  if (find.dataValues.internal_surveyor_score) {
                    find.dataValues.internal_surveyor_score =
                      (find.dataValues.internal_surveyor_score +
                        element1.internal_surveyor_score) /
                      4;
                  }

                  if (find.dataValues.external_surveyor_score) {
                    find.dataValues.external_surveyor_score =
                      (find.dataValues.external_surveyor_score +
                        element1.external_surveyor_score) /
                      4;
                  }
                } else {
                  array.push(element1);
                }
                if (score.length == index1 + 1) {
                  if (score.length == 1) {
                    librarydata[index].updator_score =
                      (element1.updator_score / 2) * 100;
                    librarydata[index].internal_surveyor_score =
                      (element1.internal_surveyor_score / 2) * 100;
                    librarydata[index].external_surveyor_score =
                      (element1.external_surveyor_score / 2) * 100;
                    librarydata[index].library_updator_score =
                      libraryUpdatorScores;
                    librarydata[index].library_internal_surveyor_score =
                      libraryInternalSurveyorScore;
                    librarydata[index].library_external_surveyor_score =
                      libraryexternalSurveyorScore;
                  } else {
                    librarydata[index].updator_score =
                      find.dataValues.updator_score * 100;
                    librarydata[index].internal_surveyor_score =
                      find.dataValues.internal_surveyor_score * 100;
                    librarydata[index].external_surveyor_score =
                      find.dataValues.external_surveyor_score * 100;
                    librarydata[index].library_updator_score =
                      libraryUpdatorScores;
                    librarydata[index].library_internal_surveyor_score =
                      libraryInternalSurveyorScore;
                    librarydata[index].library_external_surveyor_score =
                      libraryexternalSurveyorScore;
                  }

                  if (req.role_id === 5) {
                    if (user.surveyor_type == 1) {
                      librarydata[index].surveyorScore =
                        librarydata[index].internal_surveyor_score;
                    } else {
                      librarydata[index].surveyorScore =
                        librarydata[index].external_surveyor_score;
                    }
                  }

                  if (librarydata.length == index + 1) {
                    res.send(librarydata);
                  }
                }
              }
            } else {
              librarydata[index].updator_score = 0;
              librarydata[index].internal_surveyor_score = 0;
              librarydata[index].external_surveyor_score = 0;
              librarydata[index].library_updator_score = 0;
              librarydata[index].library_internal_surveyor_score = 0;
              librarydata[index].library_external_surveyor_score = 0;

              if (librarydata.length == index + 1) {
                res.send(librarydata);
              }
            }
          }
          // ====
          // console.log(score);
        } else {
          res.send(librarydata);
        }
 
      }); */
  } catch (error) {
    res.send(error);
  }
};

exports.chapterScores = async (req, res) => {
  let assigned_user_id = req.userId;
  let assigned_role_id = req.role_id;

  if (req.role_id == 6) {
    let where = `pm.user_id=${req.userId} and pm.organization_id=${req.query.organization_id} and chp.status not in (${master.status.delete})`;
    if (req.role_id == 2 || req.role_id == 3 || req.role_id == 6) {
      where = `pm.organization_id=${req.query.organization_id} and chp.status not in (${master.status.delete})`;
    }
    //user_id is client user id , foir client admin updator report its not working fine
    if (req.query.library_id) {
      where = where + ` and pm.library_id=${req.query.library_id}`;
    }

    if (req.query.session_class_id) {
      where =
        where +
        ` and sub.session_class_id like '%${req.query.session_class_id}%' `;
    }

    if (req.query.assigned_user_id) {
      assigned_user_id = req.query.assigned_user_id;
      assigned_role_id = req.query.assigned_role_id;
      where = where + ` and pm.user_id=${req.query.assigned_user_id} `;
    }

    if (req.query.assigned_role_id) {
      where = where + ` and pm.role_id=${req.query.assigned_role_id} `;
    }

    const user = await db.users.findOne({
      where: {
        id: assigned_user_id,
      },
    });

    if (!assigned_role_id) {
      assigned_role_id = user.role_id;
    }

    let sessionCondsub = "";
    //  ROUND(avg(IFNULL(updator_score,0)/2)*100) as updator_score,

    let property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${req.query.library_id}  && role_id=${assigned_role_id}  && (status is null || status=1) and user_id=${assigned_user_id}   group by substandard_id `;

    let score_mapping_up = ` select * from score_mapping where organization_id=${req.organization_id} && updator_score is not null && library_id=${req.query.library_id} and updator_id=${assigned_user_id}  group by substanard_id order by id desc `;

    let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
(case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

    let score_mapping_intsur = ` select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score is not null && library_id=${req.query.library_id} and internal_surveyor_id=${assigned_user_id}  group by substanard_id order by id desc `;

    let fields_intsur = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
(case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) as internal_surveyor_score,B.external_surveyor_score `;

    let score_mapping_extsur = ` select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score is not null && library_id=${req.query.library_id} and internal_surveyor_id=${assigned_user_id}  group by substanard_id order by id desc `;

    let fields_extsur = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
(case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) as external_surveyor_score  `;

    if (req.query.session_class_id) {
      sessionCondsub = `
  and substandard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' )
  `;
    }

    property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${req.query.library_id} ${sessionCondsub}  && role_id=${assigned_role_id}  && (status is null || status=1) and user_id=${assigned_user_id}   group by substandard_id `;

    let internalsubquery = `select ${fields_intsur}  from (${property_mapping}) as A left join (${score_mapping_intsur}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0    `;

    let externalsubquery = `select ${fields_extsur}  from (${property_mapping}) as A left join (${score_mapping_extsur}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.updator_score is null then 0 else B.updator_score end ) >=0    `;

    let internalsurveyorSubquery = ` (   select  ROUND(avg(newupdator_score),2) from (select *,avg(internal_surveyor_score * 50) as newupdator_score 
  from ( ${internalsubquery} ) as scorestd 
  where chapter_id=chp.id group by standard_id order by standard_id) as scorechp 
  group by chapter_id order by chapter_id) `;

    let externalsurveyorSubquery = ` (   select  ROUND(avg(newupdator_score),2) from (select *,avg(external_surveyor_score * 50) as newupdator_score 
  from ( ${externalsubquery} ) as scorestd 
  where chapter_id=chp.id group by standard_id order by standard_id) as scorechp 
  group by chapter_id order by chapter_id) `;

    let updatorsubquery = `select ${fields}  from (${property_mapping}) as A left join (${score_mapping_up}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.updator_score is null then 0 else B.updator_score end ) >=0    `;

    where =
      where +
      ` and pm.substandard_id in (select substandard_id from property_mapping where user_id=${req.userId} and role_id=6) `;

    let sqlsc = `select chp.*, 
  ${internalsurveyorSubquery} as internal_surveyor_score, 
  ( select  ROUND(avg(newupdator_score),2) from (select *,avg(updator_score * 50) as newupdator_score from 
  (${updatorsubquery}) as scorestd where chapter_id=chp.id group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id
  ) as updator_score,
  ${externalsurveyorSubquery} as external_surveyor_score 
    from property_mapping pm INNER join chapters chp on pm.chapter_id = chp.id 
    left join sub_standards sub on pm.substandard_id = sub.id 
    LEFT JOIN score_mapping score on chp.id = score.chapter_id and 
    score.organization_id=${req.organization_id}
    where ${where}
    group by chp.id order by chp.name `;

    let data = await db.sequelize.query(sqlsc, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (data.length > 0) {
      idx = 0;
      for (const element of data) {
        if (assigned_role_id == 5) {
          if (user.surveyor_type == 1) {
            let sqlchp = ` (select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id} and standard_id=A.standard_id)as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id}
          group by standard_id order by substanard_id desc)`;
            surveyorscore = await db.sequelize.query(sqlchp, {
              type: db.sequelize.QueryTypes.SELECT,
            });

            sqlchp = ` (select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id} and standard_id=A.standard_id)as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id}
          group by standard_id order by substanard_id desc)`;

            if (req.query.session_class_id) {
              sqlchp = ` (select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
            chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id} and standard_id=A.standard_id   and substanard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) )as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
            chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id}
            group by standard_id order by substanard_id desc)`;
            }

            score =
              surveyorscore
                .filter((el) => el.newscore != null)
                .map((el) => +el.newscore)
                .reduce((a, b) => a + b, 0) / surveyorscore.length;
            // data[idx].internal_surveyor_score = score.toFixed(2);
            data[idx].surveyor_type = user.surveyor_type;
          } else {
            sqlchp = ` (select (select avg(external_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id} and standard_id=A.standard_id)as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id}
          group by standard_id order by substanard_id desc)`;

            sqlchp = ` (select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id} and standard_id=A.standard_id)as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id}
          group by standard_id order by substanard_id desc)`;

            if (req.query.session_class_id) {
              sqlchp = ` (select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
            chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id} and standard_id=A.standard_id   and substanard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) )as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
            chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id}
            group by standard_id order by substanard_id desc)`;
            }

            surveyorscore = await db.sequelize.query(sqlchp, {
              type: db.sequelize.QueryTypes.SELECT,
            });
            score =
              surveyorscore
                .map((el) => +el.newscore)
                .reduce((a, b) => a + b, 0) / surveyorscore.length;

            //   data[idx].external_surveyor_score = score.toFixed(2);
            data[idx].surveyor_type = user.surveyor_type;
          }
        } else {
          property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${req.query.library_id}  && role_id=4  && (status is null || status=1) and user_id=${assigned_user_id}   group by substandard_id `;

          score_mapping = ` select * from score_mapping where organization_id=${req.organization_id} && updator_score is not null && library_id=${req.query.library_id} and updator_id=${assigned_user_id}  group by substanard_id order by id desc `;

          fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substanard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
 (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

          //select avg(updator_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and
          //chapter_id='${element.id}' and updator_id=${assigned_user_id} and standard_id=A.standard_id
          sqlchp = ` (select 
          (select avg(case when B.updator_score is null then 0 else B.updator_score * 50 end ) from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
          where (case when B.updator_score is null then 0 else B.updator_score end ) >=0   and A.standard_id=sm.standard_id )as newscore from score_mapping as sm where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
        chapter_id='${element.id}' and updator_id=${assigned_user_id}
        group by standard_id order by substanard_id desc)`;

          // console.log(sqlchp);
          // console.log("-------------------");
          updatorscore = await db.sequelize.query(sqlchp, {
            type: db.sequelize.QueryTypes.SELECT,
          });

          console.log(updatorscore);
          score =
            updatorscore.map((el) => +el.newscore).reduce((a, b) => a + b, 0) /
            updatorscore.length;
          // data[idx].updator_score = score.toFixed(2);
          data[idx].surveyor_type = user.surveyor_type;
        }

        idx++;
      }

      res.send(data);
    } else {
      res.send(data);
    }
  } else {
    let where = `pm.user_id=${req.userId} and pm.organization_id=${req.query.organization_id} and chp.status not in (${master.status.delete})`;
    if (req.role_id == 2 || req.role_id == 3 || req.role_id == 6) {
      where = `pm.organization_id=${req.query.organization_id} and chp.status not in (${master.status.delete})`;
    }
    //user_id is client user id , foir client admin updator report its not working fine
    if (req.query.library_id) {
      where = where + ` and pm.library_id=${req.query.library_id}`;
    }

    if (req.query.session_class_id) {
      where =
        where +
        ` and sub.session_class_id like '%${req.query.session_class_id}%' `;
    }

    if (req.query.assigned_user_id) {
      assigned_user_id = req.query.assigned_user_id;
      assigned_role_id = req.query.assigned_role_id;
      where = where + ` and pm.user_id=${req.query.assigned_user_id} `;
    }

    if (req.query.assigned_role_id) {
      where = where + ` and pm.role_id=${req.query.assigned_role_id} `;
    }

    const user = await db.users.findOne({
      where: {
        id: assigned_user_id,
      },
    });

    if (!assigned_role_id) {
      assigned_role_id = user.role_id;
    }

    let sessionCondsub = "";
    //  ROUND(avg(IFNULL(updator_score,0)/2)*100) as updator_score,

    let property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${req.query.library_id}  && role_id=${assigned_role_id}  && (status is null || status=1) and user_id=${assigned_user_id}   group by substandard_id `;

    let score_mapping_up = ` select * from score_mapping where organization_id=${req.organization_id} && updator_score is not null && library_id=${req.query.library_id} and updator_id=${assigned_user_id}  group by substanard_id order by id desc `;

    let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
(case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

    let score_mapping_intsur = ` select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score is not null && library_id=${req.query.library_id} and internal_surveyor_id=${assigned_user_id}  group by substanard_id order by id desc `;

    let fields_intsur = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
(case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) as internal_surveyor_score,B.external_surveyor_score `;

    let score_mapping_extsur = ` select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score is not null && library_id=${req.query.library_id} and internal_surveyor_id=${assigned_user_id}  group by substanard_id order by id desc `;

    let fields_extsur = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
(case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) as external_surveyor_score  `;

    if (req.query.session_class_id) {
      sessionCondsub = `
  and substandard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' )
  `;
    }

    property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${req.query.library_id} ${sessionCondsub}  && role_id=${assigned_role_id}  && (status is null || status=1) and user_id=${assigned_user_id}   group by substandard_id `;

    let internalsubquery = `select ${fields_intsur}  from (${property_mapping}) as A left join (${score_mapping_intsur}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0    `;

    let externalsubquery = `select ${fields_extsur}  from (${property_mapping}) as A left join (${score_mapping_extsur}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.updator_score is null then 0 else B.updator_score end ) >=0    `;

    let internalsurveyorSubquery = ` (   select  ROUND(avg(newupdator_score),2) from (select *,avg(internal_surveyor_score * 50) as newupdator_score 
  from ( ${internalsubquery} ) as scorestd 
  where chapter_id=chp.id group by standard_id order by standard_id) as scorechp 
  group by chapter_id order by chapter_id) `;

    let externalsurveyorSubquery = ` (   select  ROUND(avg(newupdator_score),2) from (select *,avg(external_surveyor_score * 50) as newupdator_score 
  from ( ${externalsubquery} ) as scorestd 
  where chapter_id=chp.id group by standard_id order by standard_id) as scorechp 
  group by chapter_id order by chapter_id) `;

    let updatorsubquery = `select ${fields}  from (${property_mapping}) as A left join (${score_mapping_up}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.updator_score is null then 0 else B.updator_score end ) >=0    `;

    let sqlsc = `select chp.*, 
  ${internalsurveyorSubquery} as internal_surveyor_score, 
  ( select  ROUND(avg(newupdator_score),2) from (select *,avg(updator_score * 50) as newupdator_score from 
  (${updatorsubquery}) as scorestd where chapter_id=chp.id group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id
  ) as updator_score,
  ${externalsurveyorSubquery} as external_surveyor_score 
    from property_mapping pm INNER join chapters chp on pm.chapter_id = chp.id 
    left join sub_standards sub on pm.substandard_id = sub.id 
    LEFT JOIN score_mapping score on chp.id = score.chapter_id and 
    score.organization_id=${req.organization_id}
    where ${where}
    group by chp.id order by chp.name `;

    let data = await db.sequelize.query(sqlsc, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (data.length > 0) {
      idx = 0;
      for (const element of data) {
        if (assigned_role_id == 5) {
          if (user.surveyor_type == 1) {
            let sqlchp = ` (select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id} and standard_id=A.standard_id)as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id}
          group by standard_id order by substanard_id desc)`;
            surveyorscore = await db.sequelize.query(sqlchp, {
              type: db.sequelize.QueryTypes.SELECT,
            });

            sqlchp = ` (select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id} and standard_id=A.standard_id)as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id}
          group by standard_id order by substanard_id desc)`;

            if (req.query.session_class_id) {
              sqlchp = ` (select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
            chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id} and standard_id=A.standard_id   and substanard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) )as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
            chapter_id='${element.id}' and internal_surveyor_id=${assigned_user_id}
            group by standard_id order by substanard_id desc)`;
            }

            score =
              surveyorscore
                .filter((el) => el.newscore != null)
                .map((el) => +el.newscore)
                .reduce((a, b) => a + b, 0) / surveyorscore.length;
            // data[idx].internal_surveyor_score = score.toFixed(2);
            data[idx].surveyor_type = user.surveyor_type;
          } else {
            sqlchp = ` (select (select avg(external_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id} and standard_id=A.standard_id)as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id}
          group by standard_id order by substanard_id desc)`;

            sqlchp = ` (select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id} and standard_id=A.standard_id)as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
          chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id}
          group by standard_id order by substanard_id desc)`;

            if (req.query.session_class_id) {
              sqlchp = ` (select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
            chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id} and standard_id=A.standard_id   and substanard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) )as newscore from score_mapping as A where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
            chapter_id='${element.id}' and external_surveyor_id=${assigned_user_id}
            group by standard_id order by substanard_id desc)`;
            }

            surveyorscore = await db.sequelize.query(sqlchp, {
              type: db.sequelize.QueryTypes.SELECT,
            });
            score =
              surveyorscore
                .map((el) => +el.newscore)
                .reduce((a, b) => a + b, 0) / surveyorscore.length;

            //   data[idx].external_surveyor_score = score.toFixed(2);
            data[idx].surveyor_type = user.surveyor_type;
          }
        } else {
          property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${req.query.library_id}  && role_id=4  && (status is null || status=1) and user_id=${assigned_user_id}   group by substandard_id `;

          score_mapping = ` select * from score_mapping where organization_id=${req.organization_id} && updator_score is not null && library_id=${req.query.library_id} and updator_id=${assigned_user_id}  group by substanard_id order by id desc `;

          fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substanard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
 (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

          //select avg(updator_score * 50) from score_mapping where organization_id=${req.organization_id} and library_id=${req.query.library_id} and
          //chapter_id='${element.id}' and updator_id=${assigned_user_id} and standard_id=A.standard_id
          sqlchp = ` (select 
          (select avg(case when B.updator_score is null then 0 else B.updator_score * 50 end ) from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
          where (case when B.updator_score is null then 0 else B.updator_score end ) >=0   and A.standard_id=sm.standard_id )as newscore from score_mapping as sm where organization_id=${req.organization_id} and library_id=${req.query.library_id} and 
        chapter_id='${element.id}' and updator_id=${assigned_user_id}
        group by standard_id order by substanard_id desc)`;

          // console.log(sqlchp);
          // console.log("-------------------");
          updatorscore = await db.sequelize.query(sqlchp, {
            type: db.sequelize.QueryTypes.SELECT,
          });

          console.log(updatorscore);
          score =
            updatorscore.map((el) => +el.newscore).reduce((a, b) => a + b, 0) /
            updatorscore.length;
          // data[idx].updator_score = score.toFixed(2);
          data[idx].surveyor_type = user.surveyor_type;
        }

        idx++;
      }

      if (req.role_id === 5) {
        idx = 0;
        for (const element of data) {
          if (user.surveyor_type == 1) {
            data[idx].surveyorScore = element.internal_surveyor_score;
            data[idx].surveyor_type = user.surveyor_type;
          } else {
            data[idx].surveyorScore = element.external_surveyor_score;
            data[idx].surveyor_type = user.surveyor_type;
          }

          idx++;
        }
      }

      res.send(data);
    } else {
      res.send(data);
    }
  }
};

exports.standardScores = async (req, res) => {
  let assigned_user_id = req.userId;
  let assigned_role_id = req.role_id;
  if (req.query.assigned_user_id) {
    assigned_user_id = req.query.assigned_user_id;
    assigned_role_id = req.query.assigned_role_id;
  }
  if (req.role_id == 6) {
    let where = `pm.user_id=${req.userId} and pm.organization_id=${req.query.organization_id} and std.status not in (${master.status.delete})`;
    if (req.role_id == 2 || req.role_id == 3 || req.role_id == 6) {
      where = ` pm.organization_id=${req.query.organization_id} and std.status not in (${master.status.delete})`;
    }
    if (req.query.library_id && req.query.library_id != "") {
      where = where + ` and pm.library_id=${req.query.library_id}`;
    }

    if (req.query.chapter_id && req.query.chapter_id != "") {
      where = where + ` and pm.chapter_id='${req.query.chapter_id}'`;
    }

    if (req.query.session_class_id) {
      where =
        where +
        ` and sub.session_class_id like '%${req.query.session_class_id}%' `;
    }

    if (req.query.assigned_user_id) {
      where = where + ` and pm.user_id=${req.query.assigned_user_id} `;
    }

    if (req.query.assigned_role_id) {
      where = where + ` and pm.role_id=${req.query.assigned_role_id} `;
    }

    const assigneduserDetail = await db.users.findOne({
      where: {
        id: assigned_user_id,
      },
    });
    where =
      where +
      ` and pm.substandard_id in (select substandard_id from property_mapping where user_id=${req.userId} and role_id=6) `;

    let sql = `select std.*, ROUND(avg(IFNULL(internal_surveyor_score,null)/2)*100) as internal_surveyor_score, 
  ROUND(avg(IFNULL(updator_score,null)/2)*100) as updator_score, 
  ROUND(avg(IFNULL(external_surveyor_score,null)/2)*100) as external_surveyor_score,
  '${assigneduserDetail.surveyor_type}' as surveyor_type
      from property_mapping pm INNER join standards std on pm.standard_id = std.id 
      left join sub_standards sub on pm.substandard_id = sub.id
      LEFT JOIN score_mapping score on std.id = score.standard_id and 
      score.organization_id=${req.organization_id}
      where ${where}
      group by std.id order by std.name`;

    if (req.role_id == 4 || req.query.assigned_role_id == 4) {
      console.log("updator score");
      //    ROUND((avg(IFNULL(updator_score,null)/2)*100),2) as updator_score,
      let useridcondPM = ` and user_id=${assigned_user_id}`;
      let property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${req.query.library_id}  && role_id=4  && (status is null || status=1) ${useridcondPM}  group by substandard_id `;
      let score_mapping = ` select * from score_mapping where organization_id=${req.organization_id} && updator_score is not null && library_id=${req.query.library_id}  group by substanard_id order by id desc `;
      let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;
      let score_mapping_q = `
  select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.updator_score is null then 0 else B.updator_score end ) >=0 
  `;

      sql = `
  select std.*,ROUND((avg(IFNULL(internal_surveyor_score,null)/2)*100),2) as internal_surveyor_score, 
 (select Round(avg(updator_score * 50),2) as upscore from ( ${score_mapping_q} ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as updator_score,
  ROUND((avg(IFNULL(external_surveyor_score,null)/2)*100),2) as external_surveyor_score,
'${assigneduserDetail.surveyor_type}' as surveyor_type
from property_mapping pm INNER join standards std on pm.standard_id = std.id and pm.organization_id=${req.organization_id}  and pm.role_id=${assigned_role_id} and pm.user_id=${assigned_user_id} 
left join sub_standards sub on pm.substandard_id = sub.id
LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} group by substanard_id order by createdAt desc) score on std.id = score.standard_id and 
score.organization_id=${req.organization_id} where ${where} group by std.id order by std.name
  `;
    }

    if (req.role_id == 5 || req.query.assigned_role_id == 5) {
      let useridcondPM = ` and user_id=${assigned_user_id}`;
      let property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${req.query.library_id}  && role_id=5  && (status is null || status=1) ${useridcondPM}  group by substandard_id `;
      let score_mapping_int = ` select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score is not null && library_id=${req.query.library_id}  group by substanard_id order by id desc `;
      let score_mapping_ext = ` select * from score_mapping where organization_id=${req.organization_id} && updator_score is not null && library_id=${req.query.library_id}  group by substanard_id order by id desc `;
      let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
       (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,(case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) as internal_surveyor_score,
       (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) as external_surveyor_score `;
      let score_mapping_q_int_sur = `
      select ${fields} from (${property_mapping}) as A left join (${score_mapping_int}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0 
      `;

      let score_mapping_q_ext_sur = `
      select ${fields} from (${property_mapping}) as A left join (${score_mapping_ext}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) >=0 
      `;

      sql = `
      select std.*,
      (select Round(avg(internal_surveyor_score * 50),2) as internal_surveyor_score from (${score_mapping_q_int_sur}) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as internal_surveyor_score,
     (select Round(avg(updator_score * 50),2) as upscore from ( select * from score_mapping where organization_id=${req.organization_id} && updator_score >=0  group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as updator_score,
     (select Round(avg(external_surveyor_score * 50),2) as external_surveyor_score from ( ${score_mapping_q_ext_sur} ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as external_surveyor_score, 
   
    '${assigneduserDetail.surveyor_type}' as surveyor_type
    from property_mapping pm INNER join standards std on pm.standard_id = std.id and pm.organization_id=${req.organization_id}  and pm.role_id=${assigned_role_id} and pm.user_id=${assigned_user_id} 
    left join sub_standards sub on pm.substandard_id = sub.id
    LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} group by substanard_id order by createdAt desc) score on std.id = score.standard_id and 
    score.organization_id=${req.organization_id} where ${where} group by std.id  order by std.name
      `;

      if (req.query.session_class_id) {
        score_mapping_q_int_sur = `
          select ${fields} from (${property_mapping}) as A left join (${score_mapping_int}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
          where  A.substandard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) and  (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0 
          `;

        score_mapping_q_ext_sur = `
          select ${fields} from (${property_mapping}) as A left join (${score_mapping_ext}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
          where  A.substandard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) and (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) >=0 
          `;

        sql = `
          select std.*,
          (select Round(avg(internal_surveyor_score * 50),2) as internal_surveyor_score from ( ${score_mapping_q_int_sur} ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as internal_surveyor_score,
         (select Round(avg(updator_score * 50),2) as upscore from ( select * from score_mapping where organization_id=${req.organization_id} && updator_score >=0  group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as updator_score,
         (select Round(avg(external_surveyor_score * 50),2) as external_surveyor_score from ( ${score_mapping_q_ext_sur} ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as external_surveyor_score, 
     '${assigneduserDetail.surveyor_type}' as surveyor_type
        from property_mapping pm INNER join standards std on pm.standard_id = std.id and pm.organization_id=${req.organization_id}  and pm.role_id=${assigned_role_id} and pm.user_id=${assigned_user_id} 
        left join sub_standards sub on pm.substandard_id = sub.id
        LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} and substanard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) group by substanard_id order by createdAt desc) score on std.id = score.standard_id and 
        score.organization_id=${req.organization_id} where ${where} group by std.id  order by std.name
          `;
      }
    }

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
      })
      .catch((err) => res.status(200).send([]));
  } else {
    let where = `pm.user_id=${req.userId} and pm.organization_id=${req.query.organization_id} and std.status not in (${master.status.delete})`;
    if (req.role_id == 2 || req.role_id == 3 || req.role_id == 6) {
      where = ` pm.organization_id=${req.query.organization_id} and std.status not in (${master.status.delete})`;
    }
    if (req.query.library_id && req.query.library_id != "") {
      where = where + ` and pm.library_id=${req.query.library_id}`;
    }

    if (req.query.chapter_id && req.query.chapter_id != "") {
      where = where + ` and pm.chapter_id='${req.query.chapter_id}'`;
    }

    if (req.query.session_class_id) {
      where =
        where +
        ` and sub.session_class_id like '%${req.query.session_class_id}%' `;
    }

    if (req.query.assigned_user_id) {
      where = where + ` and pm.user_id=${req.query.assigned_user_id} `;
    }

    if (req.query.assigned_role_id) {
      where = where + ` and pm.role_id=${req.query.assigned_role_id} `;
    }

    const assigneduserDetail = await db.users.findOne({
      where: {
        id: assigned_user_id,
      },
    });

    let sql = `select std.*, ROUND(avg(IFNULL(internal_surveyor_score,null)/2)*100) as internal_surveyor_score, 
  ROUND(avg(IFNULL(updator_score,null)/2)*100) as updator_score, 
  ROUND(avg(IFNULL(external_surveyor_score,null)/2)*100) as external_surveyor_score,
  '${assigneduserDetail.surveyor_type}' as surveyor_type
      from property_mapping pm INNER join standards std on pm.standard_id = std.id 
      left join sub_standards sub on pm.substandard_id = sub.id
      LEFT JOIN score_mapping score on std.id = score.standard_id and 
      score.organization_id=${req.organization_id}
      where ${where}
      group by std.id order by std.name`;

    if (req.role_id == 4 || req.query.assigned_role_id == 4) {
      console.log("updator score");
      //    ROUND((avg(IFNULL(updator_score,null)/2)*100),2) as updator_score,
      let useridcondPM = ` and user_id=${assigned_user_id}`;
      let property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${req.query.library_id}  && role_id=4  && (status is null || status=1) ${useridcondPM}  group by substandard_id `;
      let score_mapping = ` select * from score_mapping where organization_id=${req.organization_id} && updator_score is not null && library_id=${req.query.library_id}  group by substanard_id order by id desc `;
      let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;
      let score_mapping_q = `
  select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.updator_score is null then 0 else B.updator_score end ) >=0 
  `;

      //   sql = `
      //       select std.*,ROUND((avg(IFNULL(internal_surveyor_score,null)/2)*100),2) as internal_surveyor_score,
      //      (select Round(avg(updator_score * 50),2) as upscore from ( select * from score_mapping where organization_id=${req.organization_id} && updator_score >=0  group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as updator_score,
      //       ROUND((avg(IFNULL(external_surveyor_score,null)/2)*100),2) as external_surveyor_score,
      // '${assigneduserDetail.surveyor_type}' as surveyor_type
      //     from property_mapping pm INNER join standards std on pm.standard_id = std.id and pm.organization_id=${req.organization_id}  and pm.role_id=${assigned_role_id} and pm.user_id=${assigned_user_id}
      //     left join sub_standards sub on pm.substandard_id = sub.id
      //     LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} group by substanard_id order by createdAt desc) score on std.id = score.standard_id and
      //     score.organization_id=${req.organization_id} where ${where} group by std.id
      //       `;

      sql = `
  select std.*,ROUND((avg(IFNULL(internal_surveyor_score,null)/2)*100),2) as internal_surveyor_score, 
 (select Round(avg(updator_score * 50),2) as upscore from ( ${score_mapping_q} ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as updator_score,
  ROUND((avg(IFNULL(external_surveyor_score,null)/2)*100),2) as external_surveyor_score,
'${assigneduserDetail.surveyor_type}' as surveyor_type
from property_mapping pm INNER join standards std on pm.standard_id = std.id and pm.organization_id=${req.organization_id}  and pm.role_id=${assigned_role_id} and pm.user_id=${assigned_user_id} 
left join sub_standards sub on pm.substandard_id = sub.id
LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} group by substanard_id order by createdAt desc) score on std.id = score.standard_id and 
score.organization_id=${req.organization_id} where ${where} group by std.id order by std.name
  `;
    }

    if (req.role_id == 5 || req.query.assigned_role_id == 5) {
      /*
    sql = `
        select std.*,
        (select Round(avg(internal_surveyor_score * 50),2) as internal_surveyor_score from ( select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score >=0  group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as internal_surveyor_score,
       (select Round(avg(updator_score * 50),2) as upscore from ( select * from score_mapping where organization_id=${req.organization_id} && updator_score >=0  group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as updator_score,
       (select Round(avg(external_surveyor_score * 50),2) as external_surveyor_score from ( select * from score_mapping where organization_id=${req.organization_id} && external_surveyor_score >=0  group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as external_surveyor_score, 
     
  '${assigneduserDetail.surveyor_type}' as surveyor_type
      from property_mapping pm INNER join standards std on pm.standard_id = std.id and pm.organization_id=${req.organization_id}  and pm.role_id=${assigned_role_id} and pm.user_id=${assigned_user_id} 
      left join sub_standards sub on pm.substandard_id = sub.id
      LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} group by substanard_id order by createdAt desc) score on std.id = score.standard_id and 
      score.organization_id=${req.organization_id} where ${where} group by std.id
        `;*/

      let useridcondPM = ` and user_id=${assigned_user_id}`;
      let property_mapping = ` select * from property_mapping where organization_id=${req.organization_id} && library_id=${req.query.library_id}  && role_id=5  && (status is null || status=1) ${useridcondPM}  group by substandard_id `;
      let score_mapping_int = ` select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score is not null && library_id=${req.query.library_id}  group by substanard_id order by id desc `;
      let score_mapping_ext = ` select * from score_mapping where organization_id=${req.organization_id} && updator_score is not null && library_id=${req.query.library_id}  group by substanard_id order by id desc `;
      let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
       (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,(case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) as internal_surveyor_score,
       (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) as external_surveyor_score `;
      let score_mapping_q_int_sur = `
      select ${fields} from (${property_mapping}) as A left join (${score_mapping_int}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0 
      `;

      let score_mapping_q_ext_sur = `
      select ${fields} from (${property_mapping}) as A left join (${score_mapping_ext}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) >=0 
      `;

      sql = `
      select std.*,
      (select Round(avg(internal_surveyor_score * 50),2) as internal_surveyor_score from (${score_mapping_q_int_sur}) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as internal_surveyor_score,
     (select Round(avg(updator_score * 50),2) as upscore from ( select * from score_mapping where organization_id=${req.organization_id} && updator_score >=0  group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as updator_score,
     (select Round(avg(external_surveyor_score * 50),2) as external_surveyor_score from ( ${score_mapping_q_ext_sur} ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as external_surveyor_score, 
   
'${assigneduserDetail.surveyor_type}' as surveyor_type
    from property_mapping pm INNER join standards std on pm.standard_id = std.id and pm.organization_id=${req.organization_id}  and pm.role_id=${assigned_role_id} and pm.user_id=${assigned_user_id} 
    left join sub_standards sub on pm.substandard_id = sub.id
    LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} group by substanard_id order by createdAt desc) score on std.id = score.standard_id and 
    score.organization_id=${req.organization_id} where ${where} group by std.id  order by std.name
      `;

      if (req.query.session_class_id) {
        /*sql = `
          select std.*,
          (select Round(avg(internal_surveyor_score * 50),2) as internal_surveyor_score from ( select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score >=0  and substanard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as internal_surveyor_score,
         (select Round(avg(updator_score * 50),2) as upscore from ( select * from score_mapping where organization_id=${req.organization_id} && updator_score >=0  group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as updator_score,
         (select Round(avg(external_surveyor_score * 50),2) as external_surveyor_score from ( select * from score_mapping where organization_id=${req.organization_id} && external_surveyor_score >=0   and substanard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as external_surveyor_score, 
    '${assigneduserDetail.surveyor_type}' as surveyor_type
        from property_mapping pm INNER join standards std on pm.standard_id = std.id and pm.organization_id=${req.organization_id}  and pm.role_id=${assigned_role_id} and pm.user_id=${assigned_user_id} 
        left join sub_standards sub on pm.substandard_id = sub.id
        LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} and substanard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) group by substanard_id order by createdAt desc) score on std.id = score.standard_id and 
        score.organization_id=${req.organization_id} where ${where} group by std.id
          `;*/

        score_mapping_q_int_sur = `
          select ${fields} from (${property_mapping}) as A left join (${score_mapping_int}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
          where  A.substandard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) and  (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0 
          `;

        score_mapping_q_ext_sur = `
          select ${fields} from (${property_mapping}) as A left join (${score_mapping_ext}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
          where  A.substandard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) and (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) >=0 
          `;

        sql = `
          select std.*,
          (select Round(avg(internal_surveyor_score * 50),2) as internal_surveyor_score from ( ${score_mapping_q_int_sur} ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as internal_surveyor_score,
         (select Round(avg(updator_score * 50),2) as upscore from ( select * from score_mapping where organization_id=${req.organization_id} && updator_score >=0  group by substanard_id order by substanard_id desc ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as updator_score,
         (select Round(avg(external_surveyor_score * 50),2) as external_surveyor_score from ( ${score_mapping_q_ext_sur} ) as scoreA where  standard_id=std.id group by standard_id order by standard_id) as external_surveyor_score, 
    '${assigneduserDetail.surveyor_type}' as surveyor_type
        from property_mapping pm INNER join standards std on pm.standard_id = std.id and pm.organization_id=${req.organization_id}  and pm.role_id=${assigned_role_id} and pm.user_id=${assigned_user_id} 
        left join sub_standards sub on pm.substandard_id = sub.id
        LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} and substanard_id in (select id from sub_standards where session_class_id like'%${req.query.session_class_id}%' ) group by substanard_id order by createdAt desc) score on std.id = score.standard_id and 
        score.organization_id=${req.organization_id} where ${where} group by std.id  order by std.name
          `;
        // console.log("--------------------------");
        // console.log(sql);
        // return;
      }
    }

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
      })
      .catch((err) => res.status(200).send([]));
  }
};
exports.substandardScores = async (req, res) => {
  let assigned_user_id = req.userId;
  let assigned_role_id = req.role_id;
  if (req.query.assigned_user_id) {
    assigned_user_id = req.query.assigned_user_id;
    assigned_role_id = req.query.assigned_role_id;
  }

  if (req.role_id == 6) {
    let where = `pm.user_id=${req.userId} and pm.organization_id=${req.query.organization_id} and sub.status not in (${master.status.delete})`;
    if (req.role_id == 2 || req.role_id == 3 || req.role_id == 6) {
      where = ` pm.organization_id=${req.query.organization_id} and sub.status not in (${master.status.delete})`;
    }

    if (req.query.library_id && req.query.library_id != "") {
      where = where + ` and pm.library_id=${req.query.library_id} `;
    }

    if (req.query.chapter_id && req.query.chapter_id != "") {
      where = where + ` and pm.chapter_id='${req.query.chapter_id}'`;
    }

    if (req.query.standard_id && req.query.standard_id != "") {
      where = where + ` and pm.standard_id='${req.query.standard_id}'`;
    }

    if (req.query.session_class_id) {
      where =
        where +
        ` and sub.session_class_id like '%${req.query.session_class_id}%' `;
    }

    if (req.query.assigned_user_id) {
      where = where + ` and pm.user_id=${req.query.assigned_user_id} `;
    }

    if (req.query.assigned_role_id) {
      where = where + ` and pm.role_id=${req.query.assigned_role_id} `;
    }

    userDetail = await db.users.findOne({
      where: {
        id: assigned_user_id,
      },
    });

    let surScorecond = "";
    if (userDetail.surveyor_type == 1) {
      surveyorScoreCond = ` ROUND(((IFNULL(case when internal_surveyor_score=-1 then null
        else internal_surveyor_score end,0)/2)*100),2) as  surveyor_score_per`;
      surScorecond = ` (select * from score_mapping where organization_id=${req.organization_id} and internal_surveyor_id is not null group by substanard_id order by createdAt desc)`;
    } else {
      surveyorScoreCond = ` ROUND(((IFNULL(case when external_surveyor_score=-1 then null
        else external_surveyor_score end ,0)/2)*100),2) as  surveyor_score_per`;
      surScorecond = ` (select * from score_mapping where organization_id=${req.organization_id} and external_surveyor_id is not null group by substanard_id order by createdAt desc)`;
    }

    where =
      where +
      ` and pm.substandard_id in (select substandard_id from property_mapping where user_id=${req.userId} and role_id=6) `;

    let sql = `select sub.*, ROUND((IFNULL(internal_surveyor_score,null)/2)*100) as internal_surveyor_score, 
    '${userDetail.surveyor_type}' as surveyor_type,
  ROUND((IFNULL(updator_score,null)/2)*100) as updator_score, 
  ROUND((IFNULL(external_surveyor_score,null)/2)*100) as external_surveyor_score,
  ${surveyorScoreCond} 
      from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id 
      LEFT JOIN score_mapping score on sub.id = score.substanard_id and 
      score.organization_id=${req.organization_id}
      where ${where}
      group by sub.id order by sub.name`;

    if (req.query.assigned_role_id == 4 || req.role_id == 4) {
      console.log("updator score");

      sql = `select sub.*, ROUND((IFNULL(internal_surveyor_score,null)/2)*100) as internal_surveyor_score,'${userDetail.surveyor_type}' as surveyor_type,
      (case when updator_score=-1 then "N/A" else (updator_score * 50) end) as updator_score,ROUND((IFNULL(external_surveyor_score,null)/2)*100) as external_surveyor_score,
    ${surveyorScoreCond} 
        from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id and pm.organization_id=${req.organization_id}  and role_id=${assigned_role_id} and user_id=${assigned_user_id}
        LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} and updator_id is not null group by substanard_id order by createdAt desc) score on sub.id = score.substanard_id and 
        score.organization_id=${req.organization_id} where ${where} group by sub.id order by sub.name`;
    }

    if (req.query.assigned_role_id == 5 || req.role_id == 5) {
      console.log("surveyor score");

      sql = `select sub.*, 
      (case when internal_surveyor_score=-1 then "N/A" else (internal_surveyor_score * 50) end) as internal_surveyor_score,  
  '${userDetail.surveyor_type}' as surveyor_type,
  ROUND((IFNULL(updator_score,null)/2)*100) as updator_score, 
  (case when external_surveyor_score=-1 then "N/A" else (external_surveyor_score * 50) end) as external_surveyor_score,  
  ${surveyorScoreCond} 
    from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id and pm.organization_id=${req.organization_id}  and role_id=${assigned_role_id} and user_id=${assigned_user_id}
    LEFT JOIN ${surScorecond} score on sub.id = score.substanard_id and score.organization_id=${req.organization_id}  where ${where}
    group by sub.id order by sub.name`;
    }

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
      })
      .catch((err) => res.status(200).send([]));
  } else {
    let where = `pm.user_id=${req.userId} and pm.organization_id=${req.query.organization_id} and sub.status not in (${master.status.delete})`;
    if (req.role_id == 2 || req.role_id == 3 || req.role_id == 6) {
      where = ` pm.organization_id=${req.query.organization_id} and sub.status not in (${master.status.delete})`;
    }

    if (req.query.library_id && req.query.library_id != "") {
      where = where + ` and pm.library_id=${req.query.library_id} `;
    }

    if (req.query.chapter_id && req.query.chapter_id != "") {
      where = where + ` and pm.chapter_id='${req.query.chapter_id}'`;
    }

    if (req.query.standard_id && req.query.standard_id != "") {
      where = where + ` and pm.standard_id='${req.query.standard_id}'`;
    }

    if (req.query.session_class_id) {
      where =
        where +
        ` and sub.session_class_id like '%${req.query.session_class_id}%' `;
    }

    if (req.query.assigned_user_id) {
      where = where + ` and pm.user_id=${req.query.assigned_user_id} `;
    }

    if (req.query.assigned_role_id) {
      where = where + ` and pm.role_id=${req.query.assigned_role_id} `;
    }

    userDetail = await db.users.findOne({
      where: {
        id: assigned_user_id,
      },
    });

    if (req.query.assigned_role_id == 5 || req.role_id == 5) {
      // if (userDetail.surveyor_type == 1) {
      //   where = where + ` and internal_surveyor_score >=0 `;
      // } else if (userDetail.surveyor_type == 2) {
      //   where = where + ` and external_surveyor_score >=0 `;
      // }
      //we cant use this condition its conflicting in surveyor session , substandard displaying 0
      // else {
      //   where =
      //     where +
      //     ` and (internal_surveyor_score >=0 || external_surveyor_score !=0)`;
      // }
    }
    let surScorecond = "";
    if (userDetail.surveyor_type == 1) {
      surveyorScoreCond = ` ROUND(((IFNULL(case when internal_surveyor_score=-1 then null
        else internal_surveyor_score end,0)/2)*100),2) as  surveyor_score_per`;
      surScorecond = ` (select * from score_mapping where organization_id=${req.organization_id} and internal_surveyor_id is not null group by substanard_id order by createdAt desc)`;
    } else {
      surveyorScoreCond = ` ROUND(((IFNULL(case when external_surveyor_score=-1 then null
        else external_surveyor_score end ,0)/2)*100),2) as  surveyor_score_per`;
      surScorecond = ` (select * from score_mapping where organization_id=${req.organization_id} and external_surveyor_id is not null group by substanard_id order by createdAt desc)`;
    }

    let sql = `select sub.*, ROUND((IFNULL(internal_surveyor_score,null)/2)*100) as internal_surveyor_score, 
    '${userDetail.surveyor_type}' as surveyor_type,
  ROUND((IFNULL(updator_score,null)/2)*100) as updator_score, 
  ROUND((IFNULL(external_surveyor_score,null)/2)*100) as external_surveyor_score,
  ${surveyorScoreCond} 
      from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id 
      LEFT JOIN score_mapping score on sub.id = score.substanard_id and 
      score.organization_id=${req.organization_id}
      where ${where}
      group by sub.id order by sub.name`;

    if (req.query.assigned_role_id == 4 || req.role_id == 4) {
      console.log("updator score");

      sql = `select sub.*, ROUND((IFNULL(internal_surveyor_score,null)/2)*100) as internal_surveyor_score,'${userDetail.surveyor_type}' as surveyor_type,
      (case when updator_score=-1 then "N/A" else (updator_score * 50) end) as updator_score,ROUND((IFNULL(external_surveyor_score,null)/2)*100) as external_surveyor_score,
    ${surveyorScoreCond} 
        from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id and pm.organization_id=${req.organization_id}  and role_id=${assigned_role_id} and user_id=${assigned_user_id}
        LEFT JOIN (select * from score_mapping where organization_id=${req.organization_id} and updator_id is not null group by substanard_id order by createdAt desc) score on sub.id = score.substanard_id and 
        score.organization_id=${req.organization_id} where ${where} group by sub.id order by sub.name`;
    }

    if (req.query.assigned_role_id == 5 || req.role_id == 5) {
      console.log("surveyor score");

      // (case when updator_score=-1 then "N/A" else (updator_score * 50) end) as updator_score,
      //  ROUND((IFNULL(case when internal_surveyor_score=-1 then null  else internal_surveyor_score end,null)/2)*100) as internal_surveyor_score,
      //ROUND((IFNULL(case when external_surveyor_score=-1 then null else external_surveyor_score end ,null)/2)*100) as external_surveyor_score,
      sql = `select sub.*, 
      (case when internal_surveyor_score=-1 then "N/A" else (internal_surveyor_score * 50) end) as internal_surveyor_score,  
  '${userDetail.surveyor_type}' as surveyor_type,
  ROUND((IFNULL(updator_score,null)/2)*100) as updator_score, 
  (case when external_surveyor_score=-1 then "N/A" else (external_surveyor_score * 50) end) as external_surveyor_score,  
  ${surveyorScoreCond} 
    from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id and pm.organization_id=${req.organization_id}  and role_id=${assigned_role_id} and user_id=${assigned_user_id}
    LEFT JOIN ${surScorecond} score on sub.id = score.substanard_id and score.organization_id=${req.organization_id}  where ${where}
    group by sub.id order by sub.name`;
    }

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
      })
      .catch((err) => res.status(200).send([]));
  }
};
function removeNull(array) {
  return array.filter((x) => x !== null);
}

exports.activityScores = async (req, res) => {
  let org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }

  let library_id = req.query.library_id;
  let chapter_id = req.query.chapter_id;
  let standard_id = req.query.standard_id;
  let sub_standard_id = req.query.sub_standard_id;

  if (req.role_id == 6) {
    if (library_id || chapter_id || standard_id || sub_standard_id) {
      console.log("Going in");
      var where = {
        status: { [Op.notIn]: [master.status.delete] },
        admin_activity_id: { [Op.ne]: null },
        organization_id: { [Op.in]: [org_id, 0] },
      };
      var whereadmin = {
        status: { [Op.notIn]: [master.status.delete] },
        client_activity_id: { [Op.ne]: null },
        organization_id: { [Op.in]: [org_id, 0] },
      };

      whereSession = {};
      if (req.query.session_class_id) {
        whereSession.session_class_id = {
          [Op.like]: `%${req.query.session_class_id}%`,
        };
      }

      if (
        library_id &&
        library_id !== undefined &&
        library_id !== "undefined"
      ) {
        where.library_id = library_id;
        whereadmin.library_id = library_id;
      }
      if (chapter_id) {
        where.chapter_id = chapter_id;
        whereadmin.chapter_id = chapter_id;
      }
      if (standard_id) {
        where.standard_id = standard_id;
        whereadmin.standard_id = standard_id;
      }
      if (sub_standard_id) {
        where.substandard_id = sub_standard_id;
        whereadmin.substandard_id = sub_standard_id;
        if (req.role_id == 5) {
          whereSession.substandard_id = sub_standard_id;
        }
      }

      if (req.query.assigned_role_id == 5 || req.query.assigned_role_id == 4) {
        let assignedsubstandard_ids = await db.property_mapping
          .findAll({
            where: {
              user_id: req.query.assigned_user_id,
              role_id: req.query.assigned_role_id,
              organization_id: req.organization_id,
            },
            group: ["substandard_id"],
          })
          .then(function (accounts) {
            return accounts.map((account) => account.substandard_id);
          });

        whereSession.id = {
          [Op.in]: assignedsubstandard_ids,
        };

        let viwerAssignedSub = await db.property_mapping
          .findAll({
            where: {
              user_id: req.userId,
              role_id: 6,
              organization_id: req.organization_id,
            },
            group: ["substandard_id"],
          })
          .then(function (accounts) {
            return accounts.map((account) => account.substandard_id);
          });

        where.substandard_id = {
          [Op.in]: viwerAssignedSub,
        };
      }

      var client_ids = await db.activity_mapping
        .findAll({
          where: whereadmin,
          include: [
            {
              model: db.sub_standards,
              as: "sub_standards_mapping",
              where: whereSession,
            },
          ],
        })
        .then(function (accounts) {
          return accounts.map((account) => account.client_activity_id);
        });

      var admin_ids = await db.activity_mapping
        .findAll({
          where: where,
          include: [
            {
              model: db.sub_standards,
              as: "sub_standards_mapping",
              where: whereSession,
            },
          ],
        })
        .then(function (accounts1) {
          return accounts1.map((account1) => account1.admin_activity_id);
        });

      var client_ids = removeNull(client_ids);
    }

    try {
      var organization = req.query.organization_id;
      var activities_organization = {
        status: { [Op.notIn]: [master.status.delete] },
      };
      var whereCondition = { status: { [Op.notIn]: [master.status.delete] } };
      var whereConditionadmin = {
        status: { [Op.notIn]: [master.status.delete] },
      };
      if (organization) {
        whereCondition.organization_id = organization;
      }
      if (client_ids.length > 0) {
        whereCondition.id = { [Op.in]: client_ids };
      }
      if (admin_ids.length > 0) {
        whereConditionadmin.id = { [Op.in]: admin_ids };
        activities_organization.admin_activity_id = { [Op.in]: admin_ids };
      }

      let createdclientactivity = [];
      if (client_ids.length > 0) {
        createdclientactivity = await db.client_admin_activities.findAll({
          where: whereCondition,
        });
      }

      let createdadminactivity = [];
      if (admin_ids.length > 0) {
        createdadminactivity = await db.admin_activities.findAll({
          where: whereConditionadmin,
        });
      }

      var client_activity = await db.activities_organization.findAll({
        where: {
          organization_id: req.organization_id,
        },
      });

      createdadminactivity.map((x) => {
        zz = client_activity.find((y) => {
          return y.admin_activity_id === x.id;
        });
        if (zz) {
          delete zz.dataValues["id"];
          Object.assign(x, zz.dataValues);
        }
      });

      if (createdclientactivity.length > 0) {
        for (let index = 0; index < createdclientactivity.length; index++) {
          const element = createdclientactivity[index];
          if (element.type == 1) {
            var checkStorage = await db.storage_activity_checklist.findAll({
              where: {
                client_activity_id: element.id,
                organization_id: req.organization_id,
                status: { [Op.notIn]: [master.status.delete] },
              },
            });

            // .then(function (accounts) {
            //   return accounts.map((account) => account.id);
            // });
            if (checkStorage.length > 0) {
              // var checkStorageelement =
              //   await db.storage_activity_checklist_elements
              //     .findAll({ where: { storage_id: checkStorage } })
              //     .then(function (accounts) {
              //       return accounts.map((account) => account.response);
              //     });
              // var value = checkStorageelement.map(function (elt) {
              //   return parseInt(elt);
              // });
              var value = checkStorage.map((elt) => parseInt(elt.score));
              // console.log(value);
              var valuesum = value.reduce((a, b) => a + b, 0);
              //console.log(value.reduce((a, b) => a + b, 0));
              value = valuesum / value.length;
              createdclientactivity[index].dataValues.score = value.toFixed(3);
            } else {
              createdclientactivity[index].dataValues.score = 0;
            }
          } else if (element.type == 2) {
            if (element.kpi == 1) {
              //kpi
              var checkStorage = await db.storage_activity_kpi
                .findAll({
                  where: {
                    client_activity_id: element.id,
                    organization_id: req.organization_id,
                    status: { [Op.notIn]: [master.status.delete] },
                  },
                })
                .then(function (accounts) {
                  return accounts.map((account) => account.id);
                });
              if (checkStorage.length > 0) {
                var checkStorageelement = await db.storage_activity_kpi_elements
                  .findAll({ where: { storage_id: checkStorage } })
                  .then(function (accounts) {
                    return accounts.map((account) => account.score);
                  });
                var value = checkStorageelement.map(function (elt) {
                  return parseInt(elt);
                });
                var valuesum = value.reduce((a, b) => a + b, 0);
                // console.log(value.reduce((a, b) => a + b, 0));
                // createdadminactivity[index].dataValues.score =
                //   (valuesum / value.length) * 100;
                value = valuesum / value.length;
                createdclientactivity[index].dataValues.score =
                  value.toFixed(2);
              } else {
                createdclientactivity[index].dataValues.score = 0;
              }
            } else {
              //observation
              createdclientactivity[index].dataValues.score = 0;
              var checkStorage = await db.storage_observation
                .findAll({
                  where: {
                    client_activity_id: element.id,
                    organization_id: req.organization_id,
                    status: { [Op.notIn]: [master.status.delete] },
                  },
                })
                .then(function (accounts) {
                  return accounts.map((account) => {
                    return account.currency ? 100 : 0;
                  });
                });

              if (checkStorage && checkStorage.length > 0) {
                var value = checkStorage.map(function (elt) {
                  return parseInt(elt);
                });
                var valuesum = value.reduce((a, b) => a + b, 0);

                createdclientactivity[index].dataValues.score = (
                  valuesum / value.length
                ).toFixed(2);
                var value = checkStorage.map(function (elt) {
                  return parseInt(elt);
                });
              }
            }
          } else if (element.type == 3) {
            var checkStorage = await db.storage_activity_document
              .findAll({
                where: {
                  client_activity_id: element.id,
                  organization_id: req.organization_id,
                  status: { [Op.notIn]: [master.status.delete] },
                },
              })
              .then(function (accounts) {
                return accounts.map((account) => account.id);
              });
            if (checkStorage.length > 0) {
              createdclientactivity[index].dataValues.score = 100;
            } else {
              createdclientactivity[index].dataValues.score = 0;
            }
          }
        }
      }

      if (createdadminactivity.length > 0) {
        for (let index = 0; index < createdadminactivity.length; index++) {
          const element = createdadminactivity[index];
          if (element.type == 1) {
            var checkStorage = await db.storage_activity_checklist.findAll({
              where: {
                admin_activity_id: element.id,
                organization_id: req.organization_id,
                status: { [Op.notIn]: [master.status.delete] },
              },
            });

            // .then(function (accounts) {
            //   return accounts.map((account) => account.id);
            // });
            if (checkStorage.length > 0) {
              // var checkStorageelement =
              //   await db.storage_activity_checklist_elements
              //     .findAll({ where: { storage_id: checkStorage } })
              //     .then(function (accounts) {
              //       return accounts.map((account) => account.response);
              //     });

              // var value = checkStorageelement.map(function (elt) {
              //   return parseInt(elt);
              // });

              // console.log(checkStorage);

              var value = checkStorage.map((elt) => parseInt(elt.score));

              var valuesum = value.reduce((a, b) => a + b, 0);
              createdadminactivity[index].dataValues.score = (
                valuesum / value.length
              ).toFixed(3);
            } else {
              createdadminactivity[index].dataValues.score = 0;
            }
          } else if (element.type == 2) {
            if (element.kpi == 1) {
              //kpi
              var checkStorage = await db.storage_activity_kpi
                .findAll({
                  where: {
                    admin_activity_id: element.id,
                    organization_id: req.organization_id,
                    status: { [Op.notIn]: [master.status.delete] },
                  },
                })
                .then(function (accounts) {
                  return accounts.map((account) => account.id);
                });
              if (checkStorage.length > 0) {
                var checkStorageelement = await db.storage_activity_kpi_elements
                  .findAll({ where: { storage_id: checkStorage } })
                  .then(function (accounts) {
                    return accounts.map((account) => account.score);
                  });
                var value = checkStorageelement.map(function (elt) {
                  return parseInt(elt);
                });
                var valuesum = value.reduce((a, b) => a + b, 0);
                // console.log(value.reduce((a, b) => a + b, 0));
                // createdadminactivity[index].dataValues.score =
                //   (valuesum / value.length) * 100;
                createdadminactivity[index].dataValues.score = (
                  valuesum / value.length
                ).toFixed(2);
              } else {
                createdadminactivity[index].dataValues.score = 0;
              }
            } else {
              //observation
              createdadminactivity[index].dataValues.score = 0;
              var checkStorage = await db.storage_observation
                .findAll({
                  where: {
                    admin_activity_id: element.id,
                    organization_id: req.organization_id,
                    status: { [Op.notIn]: [master.status.delete] },
                  },
                })
                .then(function (accounts) {
                  return accounts.map((account) => {
                    return account.currency ? 100 : 0;
                  });
                });

              if (checkStorage && checkStorage.length > 0) {
                var value = checkStorage.map(function (elt) {
                  return parseInt(elt);
                });
                var valuesum = value.reduce((a, b) => a + b, 0);

                createdadminactivity[index].dataValues.score = (
                  valuesum / value.length
                ).toFixed(2);
                var value = checkStorage.map(function (elt) {
                  return parseInt(elt);
                });
              }
            }
          } else if (element.type == 3) {
            var checkStorage = await db.storage_activity_document
              .findAll({
                where: {
                  admin_activity_id: element.id,
                  organization_id: req.organization_id,
                  status: { [Op.notIn]: [master.status.delete] },
                },
              })
              .then(function (accounts) {
                return accounts.map((account) => account.id);
              });
            if (checkStorage.length > 0) {
              createdadminactivity[index].dataValues.score = 100;
            } else {
              createdadminactivity[index].dataValues.score = 0;
            }
          }
        }
      }

      res.send({ createdclientactivity, createdadminactivity });
    } catch (error) {
      res.send(error);
    }
  } else {
    if (library_id || chapter_id || standard_id || sub_standard_id) {
      console.log("Going in");
      var where = {
        status: { [Op.notIn]: [master.status.delete] },
        admin_activity_id: { [Op.ne]: null },
        organization_id: { [Op.in]: [org_id, 0] },
      };
      var whereadmin = {
        status: { [Op.notIn]: [master.status.delete] },
        client_activity_id: { [Op.ne]: null },
        organization_id: { [Op.in]: [org_id, 0] },
      };

      whereSession = {};
      if (req.query.session_class_id) {
        whereSession.session_class_id = {
          [Op.like]: `%${req.query.session_class_id}%`,
        };
      }

      if (
        library_id &&
        library_id !== undefined &&
        library_id !== "undefined"
      ) {
        where.library_id = library_id;
        whereadmin.library_id = library_id;
      }
      if (chapter_id) {
        where.chapter_id = chapter_id;
        whereadmin.chapter_id = chapter_id;
      }
      if (standard_id) {
        where.standard_id = standard_id;
        whereadmin.standard_id = standard_id;
      }
      if (sub_standard_id) {
        where.substandard_id = sub_standard_id;
        whereadmin.substandard_id = sub_standard_id;
        if (req.role_id == 5) {
          whereSession.substandard_id = sub_standard_id;
        }
      }

      if (req.query.assigned_role_id == 5 || req.query.assigned_role_id == 4) {
        let assignedsubstandard_ids = await db.property_mapping
          .findAll({
            where: {
              user_id: req.query.assigned_user_id,
              role_id: req.query.assigned_role_id,
              organization_id: req.organization_id,
            },
            group: ["substandard_id"],
          })
          .then(function (accounts) {
            return accounts.map((account) => account.substandard_id);
          });

        whereSession.id = {
          [Op.in]: assignedsubstandard_ids,
        };
      }

      if (req.role_id == 5) {
        // console.log(whereSession);
        //surveyor session only
        if (!sub_standard_id) {
          let filterQuery = `select A.id from sub_standards as A inner join standards as B 
          on A.standard_id=B.id inner join chapters as C on B.chapter_id = C.id where library_id=${library_id}`;

          if (req.query.chapter_id) {
            filterQuery = filterQuery + ` and chapter_id='${chapter_id}'`;
          }

          if (req.query.standard_id) {
            filterQuery = filterQuery + ` and standard_id='${standard_id}'`;
          }

          const filterSql = await db.sequelize
            .query(filterQuery, {
              type: db.sequelize.QueryTypes.SELECT,
            })
            .then((filterRes) => filterRes.map((el) => el.id));
          if (filterSql.length > 0) {
            whereSession.substandard_id = {
              [Op.in]: filterSql,
            };
          }
        }

        const activity_session_mapping_arr =
          await db.activity_session_mapping.findAll({
            where: {
              ...whereSession,
              [Op.or]: [
                {
                  organization_id: {
                    [Op.eq]: null,
                  },
                },
                {
                  organization_id: {
                    [Op.eq]: req.organization_id,
                  },
                },
              ],
            },
            // logging: console.log,
          });

        admin_ids = activity_session_mapping_arr
          .filter((el) => el.admin_activity_id !== null)
          .map((el) => el.admin_activity_id);

        client_ids = activity_session_mapping_arr
          .filter((el) => el.client_activity_id !== null)
          .map((el) => el.client_activity_id);

        // console.log(admin_ids.length);
        // console.log(client_ids.length);
        // return;
      } else {
        var client_ids = await db.activity_mapping
          .findAll({
            where: whereadmin,
            include: [
              {
                model: db.sub_standards,
                as: "sub_standards_mapping",
                where: whereSession,
              },
            ],
          })
          .then(function (accounts) {
            return accounts.map((account) => account.client_activity_id);
          });

        //console.log(where); return;
        var admin_ids = await db.activity_mapping
          .findAll({
            where: where,
            include: [
              {
                model: db.sub_standards,
                as: "sub_standards_mapping",
                where: whereSession,
              },
            ],
          })
          .then(function (accounts1) {
            return accounts1.map((account1) => account1.admin_activity_id);
          });
      }

      var client_ids = removeNull(client_ids);
    }

    try {
      let organization = req.query.organization_id;
      let activities_organization = {
        status: { [Op.notIn]: [master.status.delete] },
      };
      var whereCondition = { status: { [Op.notIn]: [master.status.delete] } };
      var whereConditionadmin = {
        status: { [Op.notIn]: [master.status.delete] },
      };
      if (organization) {
        whereCondition.organization_id = organization;
      }
      if (client_ids.length > 0) {
        whereCondition.id = { [Op.in]: client_ids };
      }
      if (admin_ids.length > 0) {
        whereConditionadmin.id = { [Op.in]: admin_ids };
        activities_organization.admin_activity_id = { [Op.in]: admin_ids };
      }

      let createdclientactivity = [];
      if (client_ids.length > 0) {
        createdclientactivity = await db.client_admin_activities.findAll({
          where: whereCondition,
        });
      }

      let createdadminactivity = [];
      if (admin_ids.length > 0) {
        createdadminactivity = await db.admin_activities.findAll({
          where: whereConditionadmin,
        });
      }

      var client_activity = await db.activities_organization.findAll({
        where: {
          organization_id: req.organization_id,
        },
      });

      createdadminactivity.map((x) => {
        zz = client_activity.find((y) => {
          return y.admin_activity_id === x.id;
        });
        if (zz) {
          delete zz.dataValues["id"];
          Object.assign(x, zz.dataValues);
        }
      });

      if (createdclientactivity.length > 0) {
        for (let index = 0; index < createdclientactivity.length; index++) {
          const element = createdclientactivity[index];
          if (element.type == 1) {
            var checkStorage = await db.storage_activity_checklist.findAll({
              where: {
                client_activity_id: element.id,
                organization_id: req.organization_id,
                status: { [Op.notIn]: [master.status.delete] },
              },
            });

            // .then(function (accounts) {
            //   return accounts.map((account) => account.id);
            // });
            if (checkStorage.length > 0) {
              // var checkStorageelement =
              //   await db.storage_activity_checklist_elements
              //     .findAll({ where: { storage_id: checkStorage } })
              //     .then(function (accounts) {
              //       return accounts.map((account) => account.response);
              //     });
              // var value = checkStorageelement.map(function (elt) {
              //   return parseInt(elt);
              // });
              var value = checkStorage.map((elt) => parseInt(elt.score));
              // console.log(value);
              var valuesum = value.reduce((a, b) => a + b, 0);
              //console.log(value.reduce((a, b) => a + b, 0));
              value = valuesum / value.length;
              createdclientactivity[index].dataValues.score = value.toFixed(3);
            } else {
              createdclientactivity[index].dataValues.score = 0;
            }
          } else if (element.type == 2) {
            if (element.kpi == 1) {
              //kpi
              var checkStorage = await db.storage_activity_kpi
                .findAll({
                  where: {
                    client_activity_id: element.id,
                    organization_id: req.organization_id,
                    status: { [Op.notIn]: [master.status.delete] },
                  },
                })
                .then(function (accounts) {
                  return accounts.map((account) => account.id);
                });
              if (checkStorage.length > 0) {
                var checkStorageelement = await db.storage_activity_kpi_elements
                  .findAll({ where: { storage_id: checkStorage } })
                  .then(function (accounts) {
                    return accounts.map((account) => account.score);
                  });
                var value = checkStorageelement.map(function (elt) {
                  return parseInt(elt);
                });
                var valuesum = value.reduce((a, b) => a + b, 0);
                // console.log(value.reduce((a, b) => a + b, 0));
                // createdadminactivity[index].dataValues.score =
                //   (valuesum / value.length) * 100;
                value = valuesum / value.length;
                createdclientactivity[index].dataValues.score =
                  value.toFixed(2);
              } else {
                createdclientactivity[index].dataValues.score = 0;
              }
            } else {
              //observation
              createdclientactivity[index].dataValues.score = 0;
              var checkStorage = await db.storage_observation
                .findAll({
                  where: {
                    client_activity_id: element.id,
                    organization_id: req.organization_id,
                    status: { [Op.notIn]: [master.status.delete] },
                  },
                })
                .then(function (accounts) {
                  return accounts.map((account) => {
                    return account.currency ? 100 : 0;
                  });
                });

              if (checkStorage && checkStorage.length > 0) {
                var value = checkStorage.map(function (elt) {
                  return parseInt(elt);
                });
                var valuesum = value.reduce((a, b) => a + b, 0);

                createdclientactivity[index].dataValues.score = (
                  valuesum / value.length
                ).toFixed(2);
                var value = checkStorage.map(function (elt) {
                  return parseInt(elt);
                });
              }
            }
          } else if (element.type == 3) {
            var checkStorage = await db.storage_activity_document
              .findAll({
                where: {
                  client_activity_id: element.id,
                  organization_id: req.organization_id,
                  status: { [Op.notIn]: [master.status.delete] },
                },
              })
              .then(function (accounts) {
                return accounts.map((account) => account.id);
              });
            if (checkStorage.length > 0) {
              createdclientactivity[index].dataValues.score = 100;
            } else {
              createdclientactivity[index].dataValues.score = 0;
            }
          }
        }
      }

      if (createdadminactivity.length > 0) {
        for (let index = 0; index < createdadminactivity.length; index++) {
          const element = createdadminactivity[index];
          if (element.type == 1) {
            var checkStorage = await db.storage_activity_checklist.findAll({
              where: {
                admin_activity_id: element.id,
                organization_id: req.organization_id,
                status: { [Op.notIn]: [master.status.delete] },
              },
            });

            // .then(function (accounts) {
            //   return accounts.map((account) => account.id);
            // });
            if (checkStorage.length > 0) {
              // var checkStorageelement =
              //   await db.storage_activity_checklist_elements
              //     .findAll({ where: { storage_id: checkStorage } })
              //     .then(function (accounts) {
              //       return accounts.map((account) => account.response);
              //     });

              // var value = checkStorageelement.map(function (elt) {
              //   return parseInt(elt);
              // });

              // console.log(checkStorage);

              var value = checkStorage.map((elt) => parseInt(elt.score));

              var valuesum = value.reduce((a, b) => a + b, 0);
              createdadminactivity[index].dataValues.score = (
                valuesum / value.length
              ).toFixed(3);
            } else {
              createdadminactivity[index].dataValues.score = 0;
            }
          } else if (element.type == 2) {
            if (element.kpi == 1) {
              //kpi
              var checkStorage = await db.storage_activity_kpi
                .findAll({
                  where: {
                    admin_activity_id: element.id,
                    organization_id: req.organization_id,
                    status: { [Op.notIn]: [master.status.delete] },
                  },
                })
                .then(function (accounts) {
                  return accounts.map((account) => account.id);
                });
              if (checkStorage.length > 0) {
                var checkStorageelement = await db.storage_activity_kpi_elements
                  .findAll({ where: { storage_id: checkStorage } })
                  .then(function (accounts) {
                    return accounts.map((account) => account.score);
                  });
                var value = checkStorageelement.map(function (elt) {
                  return parseInt(elt);
                });
                var valuesum = value.reduce((a, b) => a + b, 0);
                // console.log(value.reduce((a, b) => a + b, 0));
                // createdadminactivity[index].dataValues.score =
                //   (valuesum / value.length) * 100;
                createdadminactivity[index].dataValues.score = (
                  valuesum / value.length
                ).toFixed(2);
              } else {
                createdadminactivity[index].dataValues.score = 0;
              }
            } else {
              //observation
              createdadminactivity[index].dataValues.score = 0;
              var checkStorage = await db.storage_observation
                .findAll({
                  where: {
                    admin_activity_id: element.id,
                    organization_id: req.organization_id,
                    status: { [Op.notIn]: [master.status.delete] },
                  },
                })
                .then(function (accounts) {
                  return accounts.map((account) => {
                    return account.currency ? 100 : 0;
                  });
                });

              if (checkStorage && checkStorage.length > 0) {
                var value = checkStorage.map(function (elt) {
                  return parseInt(elt);
                });
                var valuesum = value.reduce((a, b) => a + b, 0);

                createdadminactivity[index].dataValues.score = (
                  valuesum / value.length
                ).toFixed(2);
                var value = checkStorage.map(function (elt) {
                  return parseInt(elt);
                });
              }
            }
          } else if (element.type == 3) {
            var checkStorage = await db.storage_activity_document
              .findAll({
                where: {
                  admin_activity_id: element.id,
                  organization_id: req.organization_id,
                  status: { [Op.notIn]: [master.status.delete] },
                },
              })
              .then(function (accounts) {
                return accounts.map((account) => account.id);
              });
            if (checkStorage.length > 0) {
              createdadminactivity[index].dataValues.score = 100;
            } else {
              createdadminactivity[index].dataValues.score = 0;
            }
          }
        }
      }

      if (req.role_id == 5) {
        let idx = 0;
        console.log(createdadminactivity.length);
        for (const element of createdadminactivity) {
          //   let sql = `select activity_mapping.*,property_mapping.*,C.code as sub_code,C.name as sub_name,C.description as sub_des,D.code as std_code,D.name as std_name,D.description as std_desc
          //   from activity_mapping INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id and activity_mapping.organization_id in (0,${req.organization_id}) and property_mapping.organization_id=${req.organization_id}
          //  left join sub_standards as C on activity_mapping.substandard_id=C.id left join standards as D on activity_mapping.standard_id = D.id
          //  where property_mapping.organization_id in (${req.organization_id}) AND admin_activity_id='${element.id}' and property_mapping.user_id=${req.userId} and  property_mapping.substandard_id IS NOT null`;

          let sql = `select activity_mapping.*,property_mapping.*,C.code as sub_code,C.name as sub_name,C.description as sub_des,D.code as std_code,D.name as std_name,D.description as std_desc
         from (select * from activity_mapping where organization_id in (0,${req.organization_id}) && admin_activity_id='${element.id}' ) as activity_mapping 
        INNER JOIN (select * from property_mapping where property_mapping.organization_id=${req.organization_id} &&  user_id=${req.userId}) as property_mapping 
        on activity_mapping.substandard_id = property_mapping.substandard_id    
       left join sub_standards as C on activity_mapping.substandard_id=C.id left join standards as D on activity_mapping.standard_id = D.id        
       where  property_mapping.substandard_id IS NOT null`;

          //  console.log(sql);
          //   let assign = await db.sequelize.query(sql, {
          //     type: db.sequelize.QueryTypes.SELECT,
          //   }) ;
          let assign = [];

          if (createdadminactivity[idx]) {
            createdadminactivity[idx].dataValues.assign = assign;
          }

          let assignElSql = `select *, (select code from sub_standards where substandard_uid=activity_elements.substandard_id limit 1) as substandard_code,
          (select name from sub_standards where substandard_uid=activity_elements.substandard_id limit 1) as substandard_name
          from activity_elements where admin_activity_id='${element.id}'  and (organization_id is null or organization_id=${req.organization_id})`;

          let assignElments = await db.sequelize.query(assignElSql, {
            type: db.sequelize.QueryTypes.SELECT,
          });

          if (createdadminactivity[idx]) {
            createdadminactivity[idx].dataValues.element = assignElments;
          }

          idx++;
        }

        idx = 0;
        console.log(createdclientactivity.length);
        for (const element of createdclientactivity) {
          let sql = `select activity_mapping.*,property_mapping.*,C.code as sub_code,C.name as sub_name,C.description as sub_des,D.code as std_code,D.name as std_name,D.description as std_desc
           from activity_mapping INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id and activity_mapping.organization_id in (0,${req.organization_id}) and property_mapping.organization_id=${req.organization_id}
          left join sub_standards as C on activity_mapping.substandard_id=C.id left join standards as D on activity_mapping.standard_id = D.id
          where property_mapping.organization_id in (${req.organization_id}) AND client_activity_id='${element.id}' and property_mapping.user_id=${req.userId} and  property_mapping.substandard_id IS NOT null`;

          let assign = await db.sequelize.query(sql, {
            type: db.sequelize.QueryTypes.SELECT,
          });
          if (createdclientactivity[idx]) {
            createdclientactivity[idx].dataValues.assign = assign;
          }

          let assignElSql = `select *, (select code from sub_standards where id=activity_elements.substandard_id) as substandard_code,
          (select name from sub_standards where id=activity_elements.substandard_id) as substandard_name
          from activity_elements where client_activity_id='${element.id}' and parent_id is null and (organization_id is null or organization_id=${req.organization_id})`;

          let assignElments = await db.sequelize.query(assignElSql, {
            type: db.sequelize.QueryTypes.SELECT,
          });

          if (createdclientactivity[idx]) {
            createdclientactivity[idx].dataValues.element = assignElments;
          }

          idx++;
        }
      }

      // console.log(createdadminactivity.length);
      // console.log(createdclientactivity.length); return;
      res.send({ createdclientactivity, createdadminactivity });
    } catch (error) {
      res.send(error);
    }
  }
};
//activityScoresSurveyor
exports.activityScoresSurveyor = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }

  var library_id = req.query.library_id;
  var chapter_id = req.query.chapter_id;
  var standard_id = req.query.standard_id;
  var sub_standard_id = req.query.sub_standard_id;
  //console.log(sub_standard_id);
  if (library_id || chapter_id || standard_id || sub_standard_id) {
    console.log("Going in");
    var where = {
      status: { [Op.notIn]: [master.status.delete] },
      admin_activity_id: { [Op.ne]: null },
      organization_id: { [Op.in]: [org_id, 0] },
    };
    var whereadmin = {
      status: { [Op.notIn]: [master.status.delete] },
      client_activity_id: { [Op.ne]: null },
      organization_id: { [Op.in]: [org_id, 0] },
    };

    if (library_id && library_id !== undefined && library_id !== "undefined") {
      where.library_id = library_id;
      whereadmin.library_id = library_id;
    }
    if (chapter_id) {
      where.chapter_id = chapter_id;
      whereadmin.chapter_id = chapter_id;
    }
    if (standard_id) {
      where.standard_id = standard_id;
      whereadmin.standard_id = standard_id;
    }
    if (sub_standard_id) {
      where.substandard_id = sub_standard_id;
      whereadmin.substandard_id = sub_standard_id;
    }
    // console.log(where,whereadmin,12323222)
    whereSession = {};
    if (req.query.session_class_id) {
      whereSession.session_class_id = {
        [Op.like]: `%${req.query.session_class_id}%`,
      };

      var substandard_ids = await db.property_mapping
        .findAll({
          where: {
            user_id: req.userId,
            role_id: 5,
          },
          attributes: ["substandard_id"],
          include: {
            model: db.sub_standards,
            as: "substandard",
            where: whereSession,
          },
          group: ["substandard_id"],
        })
        .then(function (accounts) {
          return accounts.map((account) => account.substandard_id);
        });
      if (substandard_ids && substandard_ids.length > 0) {
        whereSession = {};
        whereSession.id = {
          [Op.in]: substandard_ids,
        };
      }
    }

    var client_ids = await db.activity_mapping
      .findAll({
        where: whereadmin,
        include: [
          {
            model: db.sub_standards,
            as: "sub_standards_mapping",
            where: whereSession,
          },
        ],
      })
      .then(function (accounts) {
        return accounts.map((account) => account.client_activity_id);
      });

    var admin_ids = await db.activity_mapping
      .findAll({
        where: where,
        include: [
          {
            model: db.sub_standards,
            as: "sub_standards_mapping",
            where: whereSession,
          },
        ],
      })
      .then(function (accounts1) {
        //console.log(accounts1);
        return accounts1.map((account1) => account1.admin_activity_id);
      });

    console.log(whereSession);

    var client_ids = removeNull(client_ids);

    //console.log(admin_ids.length, client_ids.length);
  }

  try {
    var organization = req.query.organization_id;
    var activities_organization = {
      status: { [Op.notIn]: [master.status.delete] },
    };
    var whereCondition = { status: { [Op.notIn]: [master.status.delete] } };
    var whereConditionadmin = {
      status: { [Op.notIn]: [master.status.delete] },
    };
    if (organization) {
      whereCondition.organization_id = organization;
    }
    if (client_ids.length > 0) {
      whereCondition.id = { [Op.in]: client_ids };
    }
    if (admin_ids.length > 0) {
      whereConditionadmin.id = { [Op.in]: admin_ids };
      activities_organization.admin_activity_id = { [Op.in]: admin_ids };
    }
    var createdclientactivity = await db.client_admin_activities.findAll({
      where: whereCondition,
    });

    var createdadminactivity = await db.admin_activities.findAll({
      where: whereConditionadmin,
    });

    var client_activity = await db.activities_organization.findAll({
      where: {
        organization_id: req.organization_id,
      },
    });

    createdadminactivity.map((x) => {
      zz = client_activity.find((y) => {
        // console.log(y.admin_activity_id);
        // console.log(x.admin_activity_id);
        // console.log("-----------------");
        return y.admin_activity_id === x.id;
      });
      if (zz) {
        delete zz.dataValues["id"];
        Object.assign(x, zz.dataValues);
      }
    });

    // var createdadminactivity = await db.admin_activities.findAll({where:{ status: { [Op.notIn]: [master.status.delete] },id: { [Op.in]: [10] }}})
    // console.log(1111111111,admin_ids,client_ids,whereConditionadmin,whereCondition,createdclientactivity.length,createdadminactivity.length)

    if (createdclientactivity.length > 0) {
      for (let index = 0; index < createdclientactivity.length; index++) {
        const element = createdclientactivity[index];
        if (element.type == 1) {
          var checkStorage = await db.storage_activity_checklist
            .findAll({
              where: {
                client_activity_id: element.id,
                status: { [Op.notIn]: [master.status.delete] },
              },
            })
            .then(function (accounts) {
              return accounts.map((account) => account.id);
            });
          if (checkStorage.length > 0) {
            var checkStorageelement =
              await db.storage_activity_checklist_elements
                .findAll({ where: { storage_id: checkStorage } })
                .then(function (accounts) {
                  return accounts.map((account) => account.response);
                });
            var value = checkStorageelement.map(function (elt) {
              return parseInt(elt);
            });
            var valuesum = value.reduce((a, b) => a + b, 0);
            //console.log(value.reduce((a, b) => a + b, 0));
            createdclientactivity[index].dataValues.score =
              (valuesum / value.length) * 100;
          } else {
            createdclientactivity[index].dataValues.score = 0;
          }
        } else if (element.type == 2) {
          var checkStorage = await db.storage_activity_kpi
            .findAll({
              where: {
                client_activity_id: element.id,
                status: { [Op.notIn]: [master.status.delete] },
              },
            })
            .then(function (accounts) {
              return accounts.map((account) => account.id);
            });
          if (checkStorage.length > 0) {
            var checkStorageelement = await db.storage_activity_kpi_elements
              .findAll({ where: { storage_id: checkStorage } })
              .then(function (accounts) {
                return accounts.map((account) => account.response);
              });
            var value = checkStorageelement.map(function (elt) {
              return parseInt(elt);
            });
            var valuesum = value.reduce((a, b) => a + b, 0);
            console.log(value.reduce((a, b) => a + b, 0));
            createdclientactivity[index].dataValues.score =
              (valuesum / value.length) * 100;
          } else {
            createdclientactivity[index].dataValues.score = 0;
          }
        } else if (element.type == 3) {
          var checkStorage = await db.storage_activity_document
            .findAll({
              where: {
                client_activity_id: element.id,
                status: { [Op.notIn]: [master.status.delete] },
              },
            })
            .then(function (accounts) {
              return accounts.map((account) => account.id);
            });
          if (checkStorage.length > 0) {
            createdclientactivity[index].dataValues.score = 100;
          } else {
            createdclientactivity[index].dataValues.score = 0;
          }
        }
      }
    }
    if (createdadminactivity.length > 0) {
      for (let index = 0; index < createdadminactivity.length; index++) {
        const element = createdadminactivity[index];
        if (element.type == 1) {
          var checkStorage = await db.storage_activity_checklist
            .findAll({
              where: {
                admin_activity_id: element.id,
                status: { [Op.notIn]: [master.status.delete] },
              },
            })
            .then(function (accounts) {
              return accounts.map((account) => account.id);
            });
          if (checkStorage.length > 0) {
            var checkStorageelement =
              await db.storage_activity_checklist_elements
                .findAll({ where: { storage_id: checkStorage } })
                .then(function (accounts) {
                  return accounts.map((account) => account.response);
                });
            var value = checkStorageelement.map(function (elt) {
              return parseInt(elt);
            });
            var valuesum = value.reduce((a, b) => a + b, 0);
            // console.log(value.reduce((a, b) => a + b, 0));
            createdadminactivity[index].dataValues.score =
              (valuesum / value.length) * 100;
          } else {
            createdadminactivity[index].dataValues.score = 0;
          }
        } else if (element.type == 2) {
          var checkStorage = await db.storage_activity_kpi
            .findAll({
              where: {
                admin_activity_id: element.id,
                status: { [Op.notIn]: [master.status.delete] },
              },
            })
            .then(function (accounts) {
              return accounts.map((account) => account.id);
            });
          if (checkStorage.length > 0) {
            var checkStorageelement = await db.storage_activity_kpi_elements
              .findAll({ where: { storage_id: checkStorage } })
              .then(function (accounts) {
                return accounts.map((account) => account.score);
              });
            var value = checkStorageelement.map(function (elt) {
              return parseInt(elt);
            });
            var valuesum = value.reduce((a, b) => a + b, 0);
            console.log(value.reduce((a, b) => a + b, 0));
            createdadminactivity[index].dataValues.score =
              (valuesum / value.length) * 100;
          } else {
            createdadminactivity[index].dataValues.score = 0;
          }
        } else if (element.type == 3) {
          var checkStorage = await db.storage_activity_document
            .findAll({
              where: {
                admin_activity_id: element.id,
                status: { [Op.notIn]: [master.status.delete] },
              },
            })
            .then(function (accounts) {
              return accounts.map((account) => account.id);
            });
          if (checkStorage.length > 0) {
            createdadminactivity[index].dataValues.score = 100;
          } else {
            createdadminactivity[index].dataValues.score = 0;
          }
        }
      }
    }
    // var mappedactivity = await db.activity_mapping.count({ where: { substandard_id: substandardList, status: { [Op.notIn]: [master.status.delete] } } })
    res.send({ createdclientactivity, createdadminactivity });
  } catch (error) {
    res.send(error);
  }
};

exports.scoregetById = async (req, res) => {
  //console.log(req.params, 111);
  if (req.params.type == 1) {
    //admin activity
    var whereCondition = {
      admin_activity_id: req.params.id,
      organization_id: req.headers["organization"],
      status: { [Op.notIn]: [master.status.delete] },
    };
  } else {
    var whereCondition = {
      client_activity_id: req.params.id,
      organization_id: req.headers["organization"],
      status: { [Op.notIn]: [master.status.delete] },
    };
  }

  activityOrganization = {};
  if (req.params.type == 1) {
    var activityOrganization = await db.activities_organization.findOne({
      where: whereCondition,
    });
  } else {
    var activityOrganization = await db.client_admin_activities.findOne({
      where: {
        id: req.params.id,
        organization_id: req.headers["organization"],
        status: { [Op.notIn]: [master.status.delete] },
      },
    });
  }

  if (req.params.activitytype == 1) {
    //checklist
    var checkStorage = await db.storage_activity_checklist.findAll({
      where: whereCondition,
      include: [
        { model: db.admin_activities, as: "adminActivityDetail" },
        { model: db.client_admin_activities, as: "clientActivityDetail" },
      ],
    });

    //console.log(checkStorage);
    if (checkStorage.length > 0) {
      for (let index = 0; index < checkStorage.length; index++) {
        if (checkStorage.length > 0) {
          if (activityOrganization) {
            if (checkStorage[index].admin_activity_id) {
              checkStorage[index].dataValues.adminActivityDetail = {
                ...activityOrganization.dataValues,
              };
            } else {
              checkStorage[index].dataValues.clientActivityDetail = {
                ...activityOrganization.dataValues,
              };
            }
          }
        }

        const element = checkStorage[index];
        var checkStorageelement = await db.storage_activity_checklist_elements
          .findAll({ where: { storage_id: element.id } })
          .then(function (accounts) {
            return accounts.map((account) => account.response);
          });

        var value = checkStorageelement.map(function (elt) {
          return parseInt(elt);
        });
        var valuesum = value.reduce((a, b) => a + b, 0);
        console.log(value.reduce((a, b) => a + b, 0));
        //checkStorage[index].dataValues.score = (valuesum / value.length) * 100;
        if (checkStorage.length == index + 1) {
          res.send(checkStorage);
        }
      }
    } else {
      res.send(checkStorage);
    }
  } else if (req.params.activitytype == 2) {
    //console.log(whereCondition, 1111);

    if (activityOrganization && activityOrganization.kpi == 0) {
      checkStorage = await db.storage_observation.findAll({
        where: whereCondition,
        include: [
          { model: db.admin_activities, as: "adminActivityDetail" },
          { model: db.client_admin_activities, as: "clientActivityDetail" },
        ],
      });
    } else {
      checkStorage = await db.storage_activity_kpi.findAll({
        where: whereCondition,
        include: [
          { model: db.storage_activity_kpi_elements, as: "element" },
          { model: db.admin_activities, as: "adminActivityDetail" },
          { model: db.client_admin_activities, as: "clientActivityDetail" },
        ],
      });
    }

    //console.log(checkStorage);
    //console.log("testing", checkStorage);
    if (checkStorage.length > 0) {
      for (let index = 0; index < checkStorage.length; index++) {
        // console.log(checkStorage[index].adminActivityDetail);
        if (activityOrganization) {
          if (checkStorage[index].admin_activity_id) {
            checkStorage[index].dataValues.adminActivityDetail = {
              ...activityOrganization.dataValues,
            };
          } else {
            checkStorage[index].dataValues.clientActivityDetail = {
              ...activityOrganization.dataValues,
            };
          }
        }

        if (activityOrganization.kpi == 0) {
          checkStorage[index].dataValues.score =
            checkStorage[index].currency > 0 ? 100 : 0;
        } else {
          const element = checkStorage[index];
          var checkStorageelement = await db.storage_activity_kpi_elements
            .findAll({ where: { storage_id: element.id } })
            .then(function (accounts) {
              return accounts.map((account) => account.score);
            });

          var value = checkStorageelement.map(function (elt) {
            return parseInt(elt);
          });
          var valuesum = value.reduce((a, b) => a + b, 0);
          console.log(valuesum, value.length);

          checkStorage[index].dataValues.score =
            (valuesum / (100 * value.length)) * 100;
        }
        checkStorage[index].dataValues.elements = checkStorage[index].dataValues
          .element
          ? [...checkStorage[index].dataValues.element]
          : [];
        if (checkStorage.length == index + 1) {
          res.send(checkStorage);
        }
      }
    } else {
      res.send(checkStorage);
    }
  } else if (req.params.activitytype == 3) {
    // console.log(whereCondition);
    var checkStorage = await db.storage_activity_document.findAll({
      where: whereCondition,
      include: [
        { model: db.admin_activities, as: "adminActivityDetail" },
        { model: db.client_admin_activities, as: "clientActivityDetail" },
      ],
    });

    if (checkStorage.length > 0) {
      for (let index = 0; index < checkStorage.length; index++) {
        if (activityOrganization) {
          if (checkStorage[index].admin_activity_id) {
            checkStorage[index].dataValues.adminActivityDetail = {
              ...activityOrganization.dataValues,
            };
          } else {
            checkStorage[index].dataValues.clientActivityDetail = {
              ...activityOrganization.dataValues,
            };
          }
        }
      }
    }
    // var checkStorage=await db.storage_activity_document.findAll({where:{admin_activity_id:element.id,status:{ [Op.notIn]: [master.status.delete] }}}).then(function (accounts) { return (accounts.map(account => account.id)) })
    //if there have any document means 100 %

    checkStorage.forEach((element, idx) => {
      if (element.document_link) checkStorage[idx].dataValues.score = 100;
      else checkStorage[idx].dataValues.score = 0;
    });

    res.send(checkStorage);
  } else if (req.params.activitytype == 4) {
    console.log(whereCondition);
    var checkStorage = await db.storage_observation.findAll({
      where: whereCondition,
      include: [
        { model: db.admin_activities, as: "adminActivityDetail" },
        { model: db.client_admin_activities, as: "clientActivityDetail" },
      ],
    });

    if (checkStorage.length > 0) {
      if (activityOrganization) {
        if (checkStorage[index].admin_activity_id) {
          checkStorage[index].dataValues.adminActivityDetail = {
            ...activityOrganization.dataValues,
          };
        } else {
          checkStorage[index].dataValues.clientActivityDetail = {
            ...activityOrganization.dataValues,
          };
        }
      }
    }
    // var checkStorage=await db.storage_activity_document.findAll({where:{admin_activity_id:element.id,status:{ [Op.notIn]: [master.status.delete] }}}).then(function (accounts) { return (accounts.map(account => account.id)) })
    res.send(checkStorage);
  }
};

exports.elementscoregetById = async (req, res) => {
  console.log(req.params);
  var whereCondition = {
    storage_id: req.params.id,
    status: { [Op.notIn]: [master.status.delete] },
  };

  if (req.params.activitytype == 1) {
    //checklist
    var checkStorage = await db.storage_activity_checklist_elements
      .findAll({
        where: whereCondition,
        include: [{ model: db.activity_elements, as: "activity_elements" }],
        order: [["activity_elements", "element_code", "asc"]],
      })
      .then((data) => {
        res.send(data);
      });
  } else if (req.params.activitytype == 2) {
    console.log(whereCondition, 1111);
    var checkStorage = await db.storage_activity_kpi_elements
      .findAll({ where: whereCondition })
      .then((data) => {
        res.send(data);
      });
  }
};
exports.elementscorecommon = async (req, res) => {
  var whereCondition = {
    storage_id: { [Op.in]: req.body.id },
    status: { [Op.notIn]: [master.status.delete] },
  };
  console.log(whereCondition);

  db.storage_activity_checklist_elements
    .findAll({
      where: whereCondition,
      include: [
        { model: db.activity_elements, as: "activity_elements" },
        { model: db.storage_activity_checklist, as: "file_id" },
      ],
    })
    .then((data) => {
      res.send(data);
    });
};
exports.substandardwithactivitiesUpdator = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  db.score_mapping
    .findOne({
      where: {
        organization_id: req.headers["organization"],
        substanard_id: req.params.id,
        updator_id: { [Op.ne]: null },
      },
      order: [["id", "DESC"]],
      include: [{ model: db.sub_standards, as: "substandardJoin" }],
    })
    .then(async (data) => {
      if (data) {
        var result = await db.activity_mapping.findAll({
          where: {
            substandard_id: req.params.id,
            organization_id: { [Op.in]: [org_id, 0] },
          },
          include: [
            { model: db.admin_activities, as: "admin_activities" },
            { model: db.client_admin_activities, as: "client_activities" },
          ],
          group: ["client_activity_id", "admin_activity_id"],
        });
        if (result.length > 0) {
          //  data.dataValues.activities=result;
          result.forEach(async (element, key) => {
            result[key].dataValues.score = 100; //score not send to response,so all steps are completed score also calculated.need to check why score not send to response

            if (element.admin_activities) {
              if (element.admin_activities.type == 1) {
                var checkStorage = await db.storage_activity_checklist
                  .findAll({
                    where: {
                      admin_activity_id: element.admin_activities.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                // console.log(checkStorage);

                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_checklist_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  console.log(valuesum, 111111111111111);
                  val = (valuesum / value.length) * 100;
                  // result[key].score=(valuesum/value.length)*100
                  result[key].dataValues.score = 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.admin_activities.type == 2) {
                var checkStorage = await db.storage_activity_kpi
                  .findAll({
                    where: {
                      admin_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_kpi_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  //console.log(value.reduce((a, b) => a + b, 0));
                  result[key].dataValues.score =
                    (valuesum / value.length) * 100;
                  // createdclientactivity[index].dataValues.score=(valuesum/value.length)*100
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.admin_activities.type == 3) {
                var checkStorage = await db.storage_activity_document
                  .findAll({
                    where: {
                      admin_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  result[key].dataValues.score = 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              }
            } else if (element.client_admin_activities) {
              if (element.client_admin_activities.type == 1) {
                var checkStorage = await db.storage_activity_checklist
                  .findAll({
                    where: {
                      client_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_checklist_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  console.log(value.reduce((a, b) => a + b, 0));
                  result[key].dataValues.score =
                    (valuesum / value.length) * 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.client_admin_activities.type == 2) {
                var checkStorage = await db.storage_activity_kpi
                  .findAll({
                    where: {
                      client_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_kpi_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  //console.log(value.reduce((a, b) => a + b, 0));
                  result[key].dataValues.score =
                    (valuesum / value.length) * 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.client_admin_activities.type == 3) {
                var checkStorage = await db.storage_activity_document
                  .findAll({
                    where: {
                      client_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  result[key].dataValues.score = 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              }
            }
            if (key + 1 == result.length) {
              res.send({ data, result });
            }
          });
        } else {
          res.send(data);
        }
      }
    });
};
exports.substandardwithactivitiesInternal = async (req, res) => {
  db.score_mapping
    .findOne({
      where: {
        organization_id: req.headers["organization"],
        substanard_id: req.params.id,
        internal_surveyor_id: { [Op.ne]: null },
      },
      order: [["id", "DESC"]],
      include: [{ model: db.sub_standards, as: "substandardJoin" }],
    })
    .then(async (data) => {
      if (data) {
        var result = await db.activity_mapping.findAll({
          where: {
            substandard_id: req.params.id,
            organization_id: { [Op.in]: [req.organization_id, 0] },
          },
          include: [
            { model: db.admin_activities, as: "admin_activities" },
            { model: db.client_admin_activities, as: "client_activities" },
          ],
          group: ["client_activity_id", "admin_activity_id"],
        });
        if (result.length > 0) {
          //  data.dataValues.activities=result;
          result.forEach(async (element, key) => {
            result[key].dataValues.score = 100;

            if (element.admin_activities) {
              if (element.admin_activities.type == 1) {
                var checkStorage = await db.storage_activity_checklist
                  .findAll({
                    where: {
                      admin_activity_id: element.admin_activities.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                console.log(checkStorage);

                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_checklist_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  //console.log(valuesum, 111111111111111);
                  val = (valuesum / value.length) * 100;
                  // result[key].score=(valuesum/value.length)*100
                  result[key].dataValues.score = 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.admin_activities.type == 2) {
                var checkStorage = await db.storage_activity_kpi
                  .findAll({
                    where: {
                      admin_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_kpi_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  console.log(value.reduce((a, b) => a + b, 0));
                  result[key].dataValues.score =
                    (valuesum / value.length) * 100;
                  // createdclientactivity[index].dataValues.score=(valuesum/value.length)*100
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.admin_activities.type == 3) {
                var checkStorage = await db.storage_activity_document
                  .findAll({
                    where: {
                      admin_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  result[key].dataValues.score = 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              }
            } else if (element.client_admin_activities) {
              if (element.client_admin_activities.type == 1) {
                var checkStorage = await db.storage_activity_checklist
                  .findAll({
                    where: {
                      client_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_checklist_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  // console.log(value.reduce((a, b) => a + b, 0));
                  result[key].dataValues.score =
                    (valuesum / value.length) * 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.client_admin_activities.type == 2) {
                var checkStorage = await db.storage_activity_kpi
                  .findAll({
                    where: {
                      client_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_kpi_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  console.log(value.reduce((a, b) => a + b, 0));
                  result[key].dataValues.score =
                    (valuesum / value.length) * 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.client_admin_activities.type == 3) {
                var checkStorage = await db.storage_activity_document
                  .findAll({
                    where: {
                      client_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  result[key].dataValues.score = 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              }
            }
            if (key + 1 == result.length) {
              res.send({ data, result });
            }
          });
        } else {
          res.send(data);
        }
      } else {
        res.send(null);
      }
    });
};

exports.substandardwithactivitiesExternal = async (req, res) => {
  db.score_mapping
    .findOne({
      where: {
        organization_id: req.headers["organization"],
        substanard_id: req.params.id,
        internal_surveyor_id: { [Op.ne]: null },
      },
      order: [["id", "DESC"]],
      include: [{ model: db.sub_standards, as: "substandardJoin" }],
    })
    .then(async (data) => {
      if (data) {
        var result = await db.activity_mapping.findAll({
          where: {
            substandard_id: req.params.id,
            organization_id: { [Op.in]: [req.organization_id, 0] },
          },
          include: [
            { model: db.admin_activities, as: "admin_activities" },
            { model: db.client_admin_activities, as: "client_activities" },
          ],
          group: ["client_activity_id", "admin_activity_id"],
        });
        if (result.length > 0) {
          //  data.dataValues.activities=result;
          result.forEach(async (element, key) => {
            result[key].dataValues.score = 100;

            if (element.admin_activities) {
              if (element.admin_activities.type == 1) {
                var checkStorage = await db.storage_activity_checklist
                  .findAll({
                    where: {
                      admin_activity_id: element.admin_activities.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                //console.log(checkStorage);

                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_checklist_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  console.log(valuesum, 111111111111111);
                  val = (valuesum / value.length) * 100;
                  // result[key].score=(valuesum/value.length)*100
                  result[key].dataValues.score = 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.admin_activities.type == 2) {
                var checkStorage = await db.storage_activity_kpi
                  .findAll({
                    where: {
                      admin_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_kpi_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  //console.log(value.reduce((a, b) => a + b, 0));
                  result[key].dataValues.score =
                    (valuesum / value.length) * 100;
                  // createdclientactivity[index].dataValues.score=(valuesum/value.length)*100
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.admin_activities.type == 3) {
                var checkStorage = await db.storage_activity_document
                  .findAll({
                    where: {
                      admin_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  result[key].dataValues.score = 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              }
            } else if (element.client_admin_activities) {
              if (element.client_admin_activities.type == 1) {
                var checkStorage = await db.storage_activity_checklist
                  .findAll({
                    where: {
                      client_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_checklist_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  console.log(value.reduce((a, b) => a + b, 0));
                  result[key].dataValues.score =
                    (valuesum / value.length) * 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.client_admin_activities.type == 2) {
                var checkStorage = await db.storage_activity_kpi
                  .findAll({
                    where: {
                      client_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  var checkStorageelement =
                    await db.storage_activity_kpi_elements
                      .findAll({ where: { storage_id: checkStorage } })
                      .then(function (accounts) {
                        return accounts.map((account) => account.response);
                      });
                  var value = checkStorageelement.map(function (elt) {
                    return parseInt(elt);
                  });
                  var valuesum = value.reduce((a, b) => a + b, 0);
                  //console.log(value.reduce((a, b) => a + b, 0));
                  result[key].dataValues.score =
                    (valuesum / value.length) * 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              } else if (element.client_admin_activities.type == 3) {
                var checkStorage = await db.storage_activity_document
                  .findAll({
                    where: {
                      client_activity_id: element.id,
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                  })
                  .then(function (accounts) {
                    return accounts.map((account) => account.id);
                  });
                if (checkStorage.length > 0) {
                  result[key].dataValues.score = 100;
                } else {
                  result[key].dataValues.score = 0;
                }
              }
            }
            if (key + 1 == result.length) {
              res.send({ data, result });
            }
          });
        } else {
          res.send(data);
        }
      }
    });
};

exports.substandardSelfAssessmentUpdate = async (req, res) => {
  // console.log(req.body.updator_comment);
  //console.log(req.organization_id);
  let updator_comment = req.body.updator_comment;
  let updator_score = req.body.updator_score;

  let library_id = req.body.library_id;
  let chapter_id = req.body.chapter_id;
  let standard_id = req.body.standard_id;
  let substanard_id = req.body.substanard_id;
  let organization_id = req.organization_id;
  let updator_id = req.userId;

  if (req.role_id == 4) {
    currdate = await db.score_mapping
      .findAll({
        where: {
          library_id: library_id,
          organization_id: organization_id,
          chapter_id: chapter_id,
          standard_id: standard_id,
          substanard_id: substanard_id,
          updator_id: updator_id,
        },
      })
      .then(async (self_assessment) => {
        //console.log(self_assessment);
        if (self_assessment.length > 0) {
          //console.log("update");
          db.score_mapping
            .update(
              {
                updator_score: updator_score,
                updator_comment: updator_comment,
              },
              {
                where: {
                  organization_id: organization_id,
                  library_id: library_id,
                  chapter_id: chapter_id,
                  standard_id: standard_id,
                  substanard_id: substanard_id,
                  updator_id: updator_id,
                },
              }
            )
            .then((result) => {
              //res.send(result);
              res.send("success");
            })
            .catch((error) => {
              logger.info("/error", error);
              res.send(error);
            });
        } else {
          //console.log("create");
          await helper.AddNotificationSelfAssessment(req);
          db.score_mapping
            .create({
              library_id: library_id,
              organization_id: organization_id,
              chapter_id: chapter_id,
              standard_id: standard_id,
              substanard_id: substanard_id,
              updator_id: updator_id,
              updator_score: updator_score,
              updator_assesment_date: db.sequelize.fn("NOW"),
              updator_comment: updator_comment,
              status: 1,
            })
            .then((result) => {
              //res.status(200).send(result);
              res.send("success");
            })
            .catch((error) => {
              logger.info("/error", error);
              res.send(error);
            });
        }
      })
      .catch((error) => {
        console.log(error);
        logger.info("/error", error);
        res.send(error);
      });
  } else if (req.role_id == 5) {
    UserDetail = await db.users.findOne({
      where: {
        id: req.userId,
      },
    });

    if (UserDetail.surveyor_type == 1) {
      whereSurveyorType = {
        library_id: library_id,
        organization_id: organization_id,
        chapter_id: chapter_id,
        standard_id: standard_id,
        substanard_id: substanard_id,
        //  internal_surveyor_id: req.userId,
      };

      updateValue = {
        internal_surveyor_score: updator_score,
        internal_surveyor_comment: updator_comment,
        internal_surveyor_id: req.userId,
        internal_surveyor_assesment_date: db.sequelize.fn("NOW"),
      };
    } else {
      whereSurveyorType = {
        library_id: library_id,
        organization_id: organization_id,
        chapter_id: chapter_id,
        standard_id: standard_id,
        substanard_id: substanard_id,
        //  external_surveyor_id: req.userId,
      };

      updateValue = {
        external_surveyor_score: updator_score,
        external_surveyor_comment: updator_comment,
        external_surveyor_id: req.userId,
        external_surveyor_assesment_date: db.sequelize.fn("NOW"),
      };
    }

    await db.score_mapping
      .findAll({
        where: whereSurveyorType,
      })
      .then(async (self_assessment) => {
        if (self_assessment.length > 0) {
          // console.log("update case");

          db.score_mapping
            .update(
              { ...updateValue },
              {
                where: {
                  organization_id: organization_id,
                  library_id: library_id,
                  chapter_id: chapter_id,
                  standard_id: standard_id,
                  substanard_id: substanard_id,
                },
              }
            )
            .then((result) => {
              //res.send(result);
              res.send("success");
            })
            .catch((error) => {
              logger.info("/error", error);
              res.send(error);
            });
        } else {
          //console.log("create");
          await helper.AddNotificationSelfAssessment(req);
          db.score_mapping
            .create({
              library_id: library_id,
              organization_id: organization_id,
              chapter_id: chapter_id,
              standard_id: standard_id,
              substanard_id: substanard_id,
              status: 1,
              ...updateValue,
            })
            .then((result) => {
              //res.status(200).send(result);
              res.send("success");
            })
            .catch((error) => {
              logger.info("/error", error);
              res.send(error);
            });
        }
      })
      .catch((error) => {
        console.log(error);
        //logger.info("/error", error);
        res.send(error);
      });
  } else {
    res.send("Something Went Wrong");
  }
};
