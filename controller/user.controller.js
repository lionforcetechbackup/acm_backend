const express = require("express");
const router = express.Router();
const db = require("../models");
const bcrypt = require("bcrypt");
const master = require("../config/default.json");
var jwt = require("jsonwebtoken");
const Sequelize = require("sequelize");
const config = require("../config/jwtConfig");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
var generator = require("generate-password");
const { where } = require("sequelize");
var nodemailer = require("nodemailer");
const helper = require("../util/helper");

exports.create = async (req, res) => {
  try {
    db.users
      .create({
        email: req.body.email,
        name: req.body.name,
        role_id: req.body.role_id,
        organization_id: req.body.organization_id,
        parent_organization_id: req.body.parent_organization_id,
        mobile_number: req.body.mobile_number,
        status: master.status.active,
        // password: bcrypt.hashSync(req.body.password, 8),
        password: req.body.password, //1234567a!A
        temporary_password: req.body.password,
      })
      .then((data) => {
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

exports.AdminCreate = async (req, res) => {
  console.log(req.body);
  db.users
    .create({
      email: req.body.email,
      name: req.body.name,
      role_id: req.body.role_id,
      mobile_number: req.body.mobile_number,
      status: master.status.active,
      // user_id: "12345AB",
      password: bcrypt.hashSync(req.body.password, 8),
      temporary_password: req.body.password,
    })
    .then((data) =>
      res.send(data).catch((error) => {
        logger.info("/error", error);
        return error;
      })
    )
    .catch((error) => {
      logger.info("/error", error);
      res.send(error);
    });
};

exports.register = async (req, res) => {
  console.log(req.body);
  db.users
    .create({
      email: req.body.email,
      name: req.body.name,
      role_id: req.body.role_id,
      mobile_number: req.body.mobile_number,
      status: master.status.active,
      // user_id: "12345AB",
      password: bcrypt.hashSync(req.body.password, 8),
      temporary_password: req.body.password,
    })
    .then((data) =>
      res.send(data).catch((error) => {
        logger.info("/error", error);

        return error;
      })
    )
    .catch((error) => {
      logger.info("/error", error);

      res.send(error);
    });
};

exports.login = (req, res) => {
  console.log(req.body);
  db.users
    .findOne({
      where: {
        email: req.body.email,
      },
    })
    .then(async (user) => {
      if (!user) {
        return res.status(404).send("User Not Found.");
      }

      if (user.status !== 1) {
        return res.status(404).send("In-Active User.");
      }

      if (user.role_id > 1) {
        const organization = await db.organizations.findOne({
          where: {
            id: user.organization_id,
          },
        });

        if (organization.status == 2) {
          return res.status(404).send("User Not Found.");
        }

        if (organization.status == 0) {
          return res.status(404).send("In-Active User.");
        }
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(401).send({
          auth: false,
          accessToken: null,
          reason: "Invalid Password!",
        });
      }

      var token = jwt.sign({ id: user.id, i: user.role_id }, config.secret, {
        expiresIn: 86400, // expires in 24 hours
      });

      res.status(200).send({
        auth: true,
        accessToken: token,
        id: user.id,
        email: user.email,
        roleId: user.role_id,
        organization_id: user.organization_id,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error -> " + err);
    });
};
exports.get = async (req, res) => {
  var where = { status: { [Op.notIn]: [master.status.delete] } };

  if (req.role_id == 1) {
    where.role_id = { [Op.notIn]: [master.role.superadmin] };
  } else if (req.role_id == 2) {
    where.role_id = { [Op.notIn]: [master.role.superadmin] };
    // where.organization_id = {
    //   [Op.in]: [req.organization_id, ...parentOrganization],
    // };
    where = {
      ...where,
      [Op.or]: [
        { organization_id: req.organization_id },
        { parent_organization_id: req.organization_id },
      ],
    };
  } else if (req.role_id == 3) {
    where.role_id = {
      [Op.notIn]: [master.role.superadmin, master.role.superclientadmin],
    };
    if (req.headers["organization"]) {
      where.organization_id = req.headers["organization"];
    }
  } else if (req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  try {
    var users = await db.users.findAll({
      where: where,
      attributes: {
        exclude: ["password", "temporary_password", "jwt", "otp"],
      },
      include: [
        { model: db.roles, as: "roles" },
        { model: db.organizations, as: "parentOrganizationJoin" },
        { model: db.organizations, as: "organizationJoin" },
        //{ model: db.client_roles, as: "client_roles" },
        //   { model: db.property_mapping, as: "property_mapping" }, // property mapping
      ],
      order: [["id", "DESC"]],
    });

    if (users.length > 0) {
      for (let key = 0; key < users.length; key++) {
        const element = users[key];

        users[key].dataValues.libraryData = null;
        if (element.role_id == 2 || element.role_id == 3) {
          var libraryDetails = await db.sequelize.query(
            `select A.* from libraries as A left join organization_libraries as B 
        on A.id=B.library_id where organization_id='${element.organization_id}' group by A.id`,
            {
              type: db.sequelize.QueryTypes.SELECT,
              raw: true,
            }
          );

          users[key].dataValues.libraryData = libraryDetails;
        }

        users[key].dataValues.SurveyorCategory = null;
        users[key].dataValues.SurveyorSession = null;

        if (element.role_id == 5) {
          if (element.surveyor_session) {
            let querysession = "";
            let sessiontemp = "";
            let sessioninlist = "";
            if (element.surveyor_session.includes(",")) {
              sessiontemp = element.surveyor_session.split(",");
              sessioninlist = "'" + sessiontemp.join("','") + "'";
              sessioninlist = sessioninlist.replace(/ +/g, "");
              querysession = `select id,class_name from session_classes where id in (${sessioninlist})`;
            } else {
              querysession = `select id,class_name from session_classes where id = '${element.surveyor_session}'`;
            }

            console.log(querysession);

            users[key].dataValues.SurveyorSession = await db.sequelize.query(
              querysession,
              {
                type: db.sequelize.QueryTypes.SELECT,
                raw: true,
              }
            );
          }

          // console.log(users[key].dataValues.SurveyorSession);
          // return;
          if (element.surveyor_category) {
            let query = "";
            if (element.surveyor_category.includes(",")) {
              let surveyortemp = element.surveyor_category.split(",");
              let surveyorinlist = "'" + surveyortemp.join("','") + "'";
              query = `select id,category_name from surveyor_categories where id in (${surveyorinlist})`;
            } else {
              query = `select id,category_name from surveyor_categories where id = '${element.surveyor_category}'`;
            }
            users[key].dataValues.SurveyorCategory = await db.sequelize.query(
              query,
              {
                type: db.sequelize.QueryTypes.SELECT,
                raw: true,
              }
            );
          }
        }

        var clientroles = await db.sequelize.query(
          `select A.*,B.role_name FROM client_roles as A left join roles as B on A.role_id=B.id where A.user_id='${element.id}'`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        );

        users[key].dataValues.client_roles = clientroles;
        var userRoleCompany = await db.sequelize.query(
          `select A.id,company_id,role_id,role_name,C.name as company_name,A.surveyor_category,A.surveyor_session,
        surveyor_type,A.from_date,A.to_date
         from user_role_company as A 
        left join roles as B on A.role_id=B.id
        left join organizations as C on A.company_id = C.id
        where A.user_id='${element.id}'`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        );
        if (userRoleCompany.length > 0) {
          // await userRoleCompany.forEach(async (usercomapny, ikey) => {
          for ([ikey, usercomapny] of userRoleCompany.entries()) {
            if (userRoleCompany[ikey].role_id == 5) {
              if (!usercomapny.surveyor_session) {
                usercomapny.surveyor_session = "";
              }
              let querysession = "";
              console.log(usercomapny.surveyor_session);
              if (usercomapny.surveyor_session.includes(",")) {
                let sessiontemp = usercomapny.surveyor_session.split(",");
                let sessioninlist = "'" + sessiontemp.join("','") + "'";
                //console.log(sessioninlist);
                querysession = `select id,class_name from session_classes where id in (${sessioninlist})`;
                // console.log(querysession);
              } else {
                querysession = `select id,class_name from session_classes where id = '${usercomapny.surveyor_session}'`;
              }

              //  console.log(querysession);

              userRoleCompany[ikey].SurveyorSession = await db.sequelize.query(
                querysession,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                  raw: true,
                }
              );

              if (!usercomapny.surveyor_category) {
                usercomapny.surveyor_category = "";
              }
              let query = "";
              if (usercomapny.surveyor_category.includes(",")) {
                let surveyortemp = usercomapny.surveyor_category.split(",");
                let surveyorinlist = "'" + surveyortemp.join("','") + "'";
                query = `select id,category_name from surveyor_categories where id in (${surveyorinlist})`;
              } else {
                query = `select id,category_name from surveyor_categories where id = '${usercomapny.surveyor_category}'`;
              }
              if (userRoleCompany[ikey]) {
                userRoleCompany[ikey].SurveyorCategory =
                  await db.sequelize.query(query, {
                    type: db.sequelize.QueryTypes.SELECT,
                    raw: true,
                  });
              }
            } else {
              userRoleCompany[ikey].SurveyorCategory = null;
              userRoleCompany[ikey].SurveyorSession = null;
            }

            if (userRoleCompany[ikey]) {
              if (userRoleCompany[ikey].role_id > 3) {
                //&& A.user_id='${users[key].dataValues.id}'
                userRoleCompany[ikey].libraryData = await db.sequelize.query(
                  `select B.* from property_mapping as A left join libraries as B on A.library_id=B.id where A.organization_id='${usercomapny.company_id}'  && role_id='${usercomapny.role_id}' && A.user_id='${users[key].dataValues.id}' group by B.id`,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                    raw: true,
                  }
                );
              } else {
                userRoleCompany[ikey].libraryData = [];
              }
            }

            // });
          }
        } else {
          userRoleCompany = null;
        }

        users[key].dataValues.userRoleCompany = userRoleCompany;
        if (users.length == key + 1) {
          res.send(users);
        }
      }
    } else {
      res.send(users);
    }
  } catch (error) {
    res.send([]);
  }
};

exports.getbyuseridval = async (req, res) => {
  var where = { status: { [Op.notIn]: [master.status.delete] } };

  if (req.role_id == 2) {
    where.role_id = { [Op.notIn]: [master.role.superadmin] };
    //where.organization_id = req.organization_id;  //superclient edit user case we can see other organization user also
    where.id = req.params.userid;
  } else if (req.role_id == 3) {
    where.role_id = {
      [Op.notIn]: [master.role.superadmin, master.role.superclientadmin],
    };
    where.organization_id = req.organization_id;
    where.id = req.params.userid;
  } else if (req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  userList = await db.users.findAll({
    where: where,
    attributes: {
      exclude: ["password", "temporary_password", "jwt", "otp"],
    },
    include: [
      { model: db.roles, as: "roles" },
      { model: db.organizations, as: "parentOrganizationJoin" },
      { model: db.organizations, as: "organizationJoin" },
      //{ model: db.client_roles, as: "client_roles" },
      { model: db.property_mapping, as: "property_mapping" }, // property mapping
    ],
    order: [["id", "DESC"]],
  });

  if (userList.length > 0) {
    //console.log("nnn");
    substandard_ids = userList[0].property_mapping.map(
      (el) => el.substandard_id
    );
    //console.log(substandard_ids);

    substandradList = await db.sub_standards.findAll({
      attributes: ["id", "name", "code"],
      where: {
        id: {
          [Op.in]: substandard_ids,
        },
      },
    });

    userList[0].property_mapping.forEach((x, indx) => {
      matchsub = substandradList.find((y) => x.substandard_id == y.id);
      userList[0].dataValues.property_mapping[indx].dataValues.substandardName =
        matchsub.name;
      userList[0].dataValues.property_mapping[indx].dataValues.substandardCode =
        matchsub.code;
    });

    let idx = 0;
    for (const element of userList) {
      userList[idx].dataValues.surveyorCategories = null;
      if (element.surveyor_category) {
        surveyor_category_arr = element.surveyor_category.split(",");
        surveysCategories = await db.surveyor_categories.findAll({
          where: {
            id: { [Op.in]: surveyor_category_arr },
          },
        });
        userList[idx].dataValues.surveyorCategories = surveysCategories;
      }
      userList[idx].dataValues.surveyorSession = null;
      if (element.surveyor_session) {
        // console.log(element.surveyor_session.split(","));
        surveyor_session_arr = element.surveyor_session.split(",");
        //console.log(surveyor_session_arr);
        surveyorSession = await db.session_classes.findAll({
          where: {
            id: {
              [Op.in]: surveyor_session_arr,
            },
          },
        });
        userList[idx].dataValues.surveyorSession = surveyorSession;
      }

      userList[idx].dataValues.client_roles = null;
      clientroles = await db.sequelize.query(
        `select A.*,B.role_name FROM client_roles as A left join roles as B on A.role_id=B.id where A.user_id='${element.id}'`,
        {
          type: db.sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      userList[idx].dataValues.client_roles = clientroles;

      if (element.organizationJoin) {
        if (
          element.role_id == 4 ||
          element.role_id == 5 ||
          element.role_id == 6
        ) {
          librarydata = await db.sequelize.query(
            `select B.* from property_mapping as A left join libraries as B on A.library_id=B.id where A.user_id='${element.id}' && organization_id='${element.organizationJoin.id}' group by B.id,code`,
            { type: db.sequelize.QueryTypes.SELECT }
          );

          userList[idx].dataValues.librarydetails = librarydata;
          if (userList.length == idx + 1) {
            return res.send(userList);
          }
        } else {
          librarydata = await db.organization_libraries.findAll({
            where: {
              organization_id: element.organizationJoin.id,
              status: { [Op.notIn]: [master.status.delete] },
            },
            attributes: [["id", "organization_library_id"], "libraries.*"],
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
            group: "libraries.id",
          });

          librarydata.forEach((libEl, lidx) => {
            db.sequelize
              .query(
                `select A.id,A.name from sub_standards as A left join standards as B on A.standard_id=B.id
              left join chapters as C on B.chapter_id=C.id where library_id='${libEl.id}'`,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                }
              )
              .then((substandardData) => {
                librarydata[lidx].substandard_ids = substandardData.map(
                  (account) => account.id
                ); //accounts.map((account) => account.id);
                if (librarydata.length === lidx + 1) {
                  if (userList[idx]) {
                    userList[idx].dataValues.librarydetails = librarydata;
                  }
                  if (userList.length == idx + 1) {
                    return res.send(userList);
                  }
                }
              });
          });
          userList[idx].dataValues.librarydetails = librarydata;
        }
      }

      if (userList.length == idx + 1) {
        res.send(userList);
      }

      idx++;
    }
  } else {
    //console.log("hi");
    res.send([]);
  }

  /*
  db.users
    .findAll({
      where: where,
      attributes: {
        exclude: ["password", "temporary_password", "jwt", "otp"],
      },
      include: [
        { model: db.roles, as: "roles" },
        { model: db.organizations, as: "parentOrganizationJoin" },
        { model: db.organizations, as: "organizationJoin" },
        //{ model: db.client_roles, as: "client_roles" },
        { model: db.property_mapping, as: "property_mapping" }, // property mapping
      ],
      order: [["id", "DESC"]],
    })
    .then((data) => {
      if (data.length > 0) {
        // console.log(data.length);
        // data.forEach((element, key) => {
        for (let key = 0; key < data.length; key++) {
          const element = data[key];

          if (element.surveyor_category) {
            surveyor_category_arr = element.surveyor_category.split(",");
            db.surveyor_categories
              .findAll({
                where: {
                  id: { [Op.in]: surveyor_category_arr },
                },
              })
              .then((surveysCategories) => {
                data[key].dataValues.surveyorCategories = surveysCategories;
              });
          }

          if (element.surveyor_session) {
            // console.log(element.surveyor_session.split(","));
            surveyor_session_arr = element.surveyor_session.split(",");
            //console.log(surveyor_session_arr);
            db.session_classes
              .findAll({
                where: {
                  id: {
                    [Op.in]: surveyor_session_arr,
                  },
                },
              })
              .then((surveyorSession) => {
                data[key].dataValues.surveyorSession = surveyorSession;
              });
          }

          db.sequelize
            .query(
              `select A.*,B.role_name FROM client_roles as A left join roles as B on A.role_id=B.id where A.user_id='${element.id}'`,
              {
                type: db.sequelize.QueryTypes.SELECT,
                raw: true,
              }
            )
            .then((clientroles) => {
              data[key].dataValues.client_roles = clientroles;
            });

          if (element.organizationJoin) {
            if (
              element.role_id == 4 ||
              element.role_id == 5 ||
              element.role_id == 6
            ) {
              db.sequelize
                .query(
                  `select B.* from property_mapping as A left join libraries as B on A.library_id=B.id where A.user_id='${element.id}' && organization_id='${element.organizationJoin.id}' group by B.id,code`,
                  { type: db.sequelize.QueryTypes.SELECT }
                )
                .then((librarydata) => {
                  data[key].dataValues.librarydetails = librarydata;
                  if (data.length == key + 1) {
                    res.send(data);
                  }
                });
            } else {
              db.organization_libraries
                .findAll({
                  where: {
                    organization_id: element.organizationJoin.id,
                    status: { [Op.notIn]: [master.status.delete] },
                  },
                  attributes: [
                    ["id", "organization_library_id"],
                    "libraries.*",
                  ],
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
                  group: "libraries.id",
                })
                .then((librarydata) => {
                  // console.log(data);

                  librarydata.forEach((libEl, idx) => {
                    db.sequelize
                      .query(
                        `select A.id,A.name from sub_standards as A left join standards as B on A.standard_id=B.id
                  left join chapters as C on B.chapter_id=C.id where library_id='${libEl.id}'`,
                        {
                          type: db.sequelize.QueryTypes.SELECT,
                        }
                      )
                      .then((substandardData) => {
                        librarydata[idx].substandard_ids = substandardData.map(
                          (account) => account.id
                        ); //accounts.map((account) => account.id);
                        if (librarydata.length === idx + 1) {
                          data[key].dataValues.librarydetails = librarydata;
                          if (data.length == key + 1) {
                            res.send(data);
                          }
                        }
                      });
                  });
                })
                .catch((error) => {
                  logger.info("/error", error);
                  res.send(error);
                });
            }
          } else {
            if (data.length == key + 1) {
              res.send(data);
            }
          }
        }
      } else {
        res.send(data);
      }
    });   */
};

exports.getAssignedCompany = async (req, res) => {
  await db.sequelize
    .query(
      `select B.role_name,C.name as company_name from user_role_company as A left join roles as B on A.role_id=B.id
      left join organizations as C on A. = C.id where user_id=${req.userId}`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    )
    .then((result) => res.send(result))
    .catch((error) => res.send(error));
};
exports.getClientUserList = async (req, res) => {
  var where = { status: { [Op.notIn]: [master.status.delete] } };

  where.role_id = {
    [Op.in]: [2, 3],
  };

  if (req.role_id == 2) {
    where.role_id = { [Op.notIn]: [master.role.superadmin] };
    // where.organization_id = req.headers["organization"];
  } else if (req.role_id == 3) {
    where.role_id = {
      [Op.notIn]: [master.role.superadmin, master.role.superclientadmin],
    };
    where.organization_id = req.organization_id;
  } else if (req.role_id != 1 && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  // if(req.headers['organization']){
  //     console.log(req.headers['organization'])
  //     where.organization_id=req.headers['organization'];
  // }
  //console.log(req.role_id, req.userId, where);
  db.users
    .findAll({
      where: where,
      attributes: {
        exclude: ["password", "temporary_password", "jwt", "otp"],
      },
      include: [
        { model: db.roles, as: "roles" },
        { model: db.organizations, as: "parentOrganizationJoin" },
        { model: db.organizations, as: "organizationJoin" },
        //{ model: db.client_roles, as: "client_roles" },
      ],
      order: [["id", "DESC"]],
    })
    .then((data) => {
      if (data.length > 0) {
        // console.log(data.length);
        // data.forEach((element, key) => {
        for (let key = 0; key < data.length; key++) {
          const element = data[key];

          if (element.surveyor_category) {
            surveyor_category_arr = element.surveyor_category.split(",");
            db.surveyor_categories
              .findAll({
                where: {
                  id: { [Op.in]: surveyor_category_arr },
                },
              })
              .then((surveysCategories) => {
                data[key].dataValues.surveyorCategories = surveysCategories;
              });
          }

          if (element.surveyor_session) {
            // console.log(element.surveyor_session.split(","));
            surveyor_session_arr = element.surveyor_session.split(",");
            //console.log(surveyor_session_arr);
            db.session_classes
              .findAll({
                where: {
                  id: {
                    [Op.in]: surveyor_session_arr,
                  },
                },
              })
              .then((surveyorSession) => {
                data[key].dataValues.surveyorSession = surveyorSession;
              });
          }

          data[key].dataValues.organizationLibrary = null;

          mainRoganization = element.organization_id;

          if (element.parent_organization_id) {
            mainRoganization = element.parent_organization_id;
          }

          db.sequelize
            .query(
              `select * from libraries as A left join organization_libraries as B on A.id=B.library_id where organization_id=${mainRoganization} group by A.id`,
              {
                type: db.sequelize.QueryTypes.SELECT,
                raw: true,
              }
            )
            .then(
              (libraries) =>
                (data[key].dataValues.organizationLibrary = libraries)
            );

          db.sequelize
            .query(
              `select A.*,B.role_name FROM client_roles as A left join roles as B on A.role_id=B.id where A.user_id='${element.id}'`,
              {
                type: db.sequelize.QueryTypes.SELECT,
                raw: true,
              }
            )
            .then((clientroles) => {
              data[key].dataValues.client_roles = clientroles;
            });

          if (element.organizationJoin) {
            db.organization_libraries
              .findAll({
                where: {
                  organization_id: element.organizationJoin.id,
                  status: { [Op.notIn]: [master.status.delete] },
                },
                attributes: [["id", "organization_library_id"], "libraries.*"],
                include: [
                  {
                    model: db.libraries,
                    as: "libraries",
                    attributes: [],
                    nested: false,
                    required: true,
                  },
                ],
                group: "libraries.id",
                raw: true,
              })
              .then((librarydata) => {
                data[key].dataValues.librarydetails = librarydata;
                // console.log(data);

                if (data.length == key + 1) {
                  res.send(data);
                }
              })
              .catch((error) => {
                logger.info("/error", error);
                res.send(error);
              });
          } else {
            if (data.length == key + 1) {
              res.send(data);
            }
          }
        }
      } else {
        res.send(data);
      }
    });
};

exports.getUserAllRole = async (req, res) => {
  console.log(req.params.id);
  try {
    var assigned = await db.client_roles.findAll({
      attributes: [
        "user_id",
        "role_id",
        ["id", "client_roles_id"],
        "roles.id",
        "roles.role_name",
      ],
      include: [
        {
          model: db.roles,
          as: "roles",
          attributes: [],
          nested: false,
          required: true,
        },
      ],
      where: {
        // status: { [Op.notIn]: [master.status.delete] },
        user_id: req.params.id,
      },
      raw: true,
      order: [["id", "DESC"]],
    });

    var added = await db.users.findAll({
      attributes: [
        ["id", "user_id"],
        "role_id",
        ["id", "client_roles_id"],
        "roles.id",
        "roles.role_name",
      ],
      include: [
        {
          model: db.roles,
          as: "roles",
          attributes: [],
          nested: false,
          required: true,
        },
      ],
      where: {
        //status: { [Op.notIn]: [master.status.delete] },
        id: req.params.id,
      },
      raw: true,
      order: [["id", "DESC"]],
    });

    let final = added.concat(assigned);
    res.send(final);

    // .then((data) => res.send(data))
    // .catch((error) => {
    //   logger.info("/error", error);
    //   res.send(error);
    // });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.getById = async (req, res) => {
  db.users
    .findAll({
      where: {
        id: req.params.id,
      },
      attributes: {
        exclude: ["password", "temporary_password", "jwt", "otp"],
      },
    })
    .then((data) => res.send(data));
};

exports.delete = async (req, res) => {
  var userinactive = await db.users.findOne({
    where: {
      status: master.status.inactive,
      id: req.params.id,
    },
  });

  if (userinactive) {
    if (userinactive.role_id <= 3) {
      await db.organizations.update(
        {
          status: master.status.delete,
        },
        {
          where: {
            [Op.or]: [
              {
                id: userinactive.organization_id,
              },
              {
                parent_id: userinactive.organization_id,
              },
            ],
          },
        }
      );
      await db.users.update(
        {
          status: master.status.delete,
        },
        {
          where: {
            [Op.or]: [
              {
                organization_id: userinactive.organization_id,
              },
              {
                parent_organization_id: userinactive.organization_id,
              },
            ],
          },
        }
      );
    }

    db.users
      .update(
        {
          status: master.status.delete,
        },
        {
          where: {
            id: req.params.id,
          },
        }
      )
      .then((data) => res.send("success"))
      .catch((err) => console.log(err));
  } else {
    if (userinactive) {
      if (userinactive.role_id <= 3) {
        await db.organizations.update(
          {
            status: master.status.inactive,
          },
          {
            where: {
              [Op.or]: [
                {
                  id: userinactive.organization_id,
                },
                {
                  parent_id: userinactive.organization_id,
                },
              ],
            },
          }
        );
        await db.users.update(
          {
            status: master.status.inactive,
          },
          {
            where: {
              [Op.or]: [
                {
                  organization_id: userinactive.organization_id,
                },
                {
                  parent_organization_id: userinactive.organization_id,
                },
              ],
            },
          }
        );
      }
    }

    db.users
      .update(
        {
          status: master.status.inactive,
        },
        {
          where: {
            id: req.params.id,
          },
        }
      )
      .then((data) => res.send("success"))
      .catch((err) => console.log(err));
  }
};
exports.update = async (req, res) => {
  db.users
    .update(
      {
        name: req.body.name,
      },
      {
        where: { id: req.body.id },
      }
    )
    .then(() => res.send("success"));
};

exports.ClientAdminGet = async (req, res) => {
  db.users
    .findAll({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
        organization_id: {
          [Op.not]: null,
        },
      },
      include: [
        { model: db.roles, as: "roles" },
        { model: db.companies, as: "companies" },
      ],
    })
    .then((data) => res.send(data));
};

exports.statusChange = async (req, res) => {
  const usersDetail = await db.users.findOne({
    where: { id: req.params.id },
  });

  try {
    db.users
      .update(
        {
          status: req.params.status,
        },
        {
          where: { id: req.params.id },
        }
      )
      .then(async (data) => {
        if (usersDetail <= 3) {
          await db.organizations.update(
            {
              status: req.params.status,
            },
            {
              where: {
                [Op.or]: [
                  {
                    id: usersDetail.organization_id,
                  },
                  {
                    parent_id: usersDetail.organization_id,
                  },
                ],
              },
            }
          );
          await db.users.update(
            {
              status: req.params.status,
            },
            {
              where: {
                [Op.or]: [
                  {
                    organization_id: usersDetail.organization_id,
                  },
                  {
                    parent_organization_id: usersDetail.organization_id,
                  },
                ],
              },
            }
          );
        }

        auditCreate.create({
          user_id: req.userId,
          table_name: "surveyor_session",
          primary_id: data.id,
          event: "delete",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send({ message: "Status Changed Succesfully" });
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

exports.getFromDate = async (req, res) => {
  return res.send({ startdate: "2021-01-01" });
}

exports.clientAdminCompanyUpdate = async (req, res) => {
  db.user_role_company
    .findAll({
      where: {
        // role_id: req.body.role_id,
        // company_id: req.body.company_id,
        user_id: req.body.user_id, // requested user id
        role_id: req.body.role_id, //requested role id
        company_id: req.body.organization_id, //requested company id
      },
    })
    .then(async (user_role_company) => {
      if (user_role_company.length > 0) {
        return res.status(400).send("Company Already Added");
      }

      if (req.body.role_id == 3) {
        await db.user_role_company.create({
          user_id: req.body.user_id,
          role_id: req.body.role_id,
          company_id: req.body.organization_id,
        });

        if (req.body.library && req.body.library.length != 0) {
          req.body.library.forEach((element) => {
            //console.log(element);
            db.organization_libraries
              .create({
                organization_id: req.body.organization_id,
                library_id: element,
                status: master.status.active,
                archive: master.status.inactive,
              })
              .then((libraryData) => {
                auditCreate.create({
                  user_id: req.userId,
                  table_name: "organization_libraries",
                  primary_id: libraryData.id,
                  event: "create",
                  new_value: libraryData.dataValues,
                  url: req.url,
                  user_agent: req.headers["user-agent"],
                  ip_address: req.connection.remoteAddress,
                });
              });
          });
        }
        res.send("created");
      } else if (req.body.role_id == 4) {
        await db.user_role_company.create({
          user_id: req.body.user_id,
          role_id: req.body.role_id,
          company_id: req.body.organization_id,
        });

        if (req.body.substandard_ids.length > 0) {
          console.log("assign property");
          let updatorAssignedProps = [];
          req.body.substandard_ids.forEach((sub_id, key) => {
            db.sequelize
              .query(
                `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                }
              )
              .then((finaldata) => {
                //console.log(sub_id);
                //console.log(finaldata);

                updatorAssignedProps.push({
                  organization_id: req.body.organization_id,
                  library_id: finaldata[0].library_id,
                  chapter_id: finaldata[0].chapter_id,
                  standard_id: finaldata[0].standard_id,
                  substandard_id: finaldata[0].id,
                  client_id: req.userId,
                  user_id: req.body.user_id,
                  role_id: req.body.role_id,
                });

                if (req.body.substandard_ids.length == key + 1) {
                  db.property_mapping
                    .bulkCreate(updatorAssignedProps)
                    .then((result) => res.send("created"));
                }
              });
          });
        } else {
          res.send("created");
        }
      } else if (req.body.role_id == 5) {
        if (req.body.surveyor_category.length > 0) {
          var surveyor_category = req.body.surveyor_category.toString();
        } else {
          var surveyor_category = req.body.surveyor_category;
        }

        if (req.body.surveyor_session.length > 0) {
          var surveyor_session = req.body.surveyor_session.toString();
        } else {
          var surveyor_session = req.body.surveyor_session;
        }

        db.user_role_company.create({
          user_id: req.body.user_id,
          role_id: req.body.role_id,
          company_id: req.body.organization_id,
          surveyor_category:
            req.body.surveyor_category != "" ? surveyor_category : null,
          surveyor_type: req.body.surveyor_type,
          surveyor_session:
            req.body.surveyor_session != "" ? surveyor_session : null,
          to_date: req.body.to_date != "" ? req.body.to_date : null,
          from_date: req.body.from_date != "" ? req.body.from_date : null,
        });

        if (req.body.properties) {
          console.log("assign property");
          let surveyorAssignedProps = [];
          req.body.properties.chapter_id.forEach((element) => {
            // console.log('ele'+element.id);
            element.standard_id.forEach((standard_element) => {
              //  console.log('std'+standard_element.id);
              standard_element.sub_standard_id.forEach(
                (substandard_element) => {
                  surveyorAssignedProps.push({
                    organization_id: req.body.organization_id,
                    library_id: req.body.properties.library_id,
                    chapter_id: element.id,
                    standard_id: standard_element.id,
                    substandard_id: substandard_element,
                    client_id: req.userId,
                    user_id: req.body.user_id,
                    role_id: req.body.role_id,
                  });
                }
              ); //sub standard element closing
            }); // standard el closing
          }); //chapter closing

          db.property_mapping
            .bulkCreate(surveyorAssignedProps)
            .then((result) => res.send("created"))
            .catch(async (error) => {
              await db.user_role_company.destroy({
                where: {
                  user_id: data.id,
                  role_id: req.body.role_id,
                },
              });

              res.send(error);
            });
        } else {
          res.send("created");
        }
      } else if (req.body.role_id == 6) {
        await db.user_role_company.create({
          user_id: req.body.user_id,
          role_id: req.body.role_id,
          company_id: req.body.organization_id,
        });

        if (req.body.properties) {
          console.log("assign property");
          viewerAssignedProps = [];

          req.body.properties.chapter_id.forEach((element) => {
            // console.log('ele'+element.id);
            element.standard_id.forEach((standard_element) => {
              //  console.log('std'+standard_element.id);
              standard_element.sub_standard_id.forEach(
                (substandard_element) => {
                  viewerAssignedProps.push({
                    organization_id: req.body.organization_id,
                    library_id: req.body.properties.library_id,
                    chapter_id: element.id,
                    standard_id: standard_element.id,
                    substandard_id: substandard_element,
                    client_id: req.userId,
                    user_id: req.body.user_id,
                    role_id: req.body.role_id,
                  });
                }
              ); //sub standard element closing
            }); // standard el closing
          }); //chapter closing

          db.property_mapping
            .bulkCreate(viewerAssignedProps)
            .then((result) => res.send("created"));
        } else {
          res.send("created");
        }
      }
    })
    .catch((error) => res.send(error));
};

async function uniq(a) {
  return Array.from(new Set(a));
}

exports.clientAdminUserCreate = async (req, res) => {
  var properties = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  // console.log(req.body)
  var password = generator.generate({
    length: 20,
    numbers: true,
    uppercase: true,
    lowercase: true,
    strict: true,
    symbols: true,
    exclude: `<>&"':#$`,
  });

  var organizations = await db.organizations.findOne({
    where: {
      id: req.body.organization_id,
    },
  });

  //console.log(req.body.organization_id);

  if (req.body.role_id == 3) {
    var contUserCA = await db.users.findAll({
      where: {
        organization_id: req.body.organization_id,
        [Op.or]: [{ role_id: 2 }, { role_id: 3 }],
      },
    });

    if (contUserCA.length > 0) {
      return res.status(401).send("Client Admin Already Exist");
    }
  }

  var clientUser = await db.users.findAll({
    where: {
      organization_id: req.body.organization_id,
      role_id: req.body.role_id,
    },
  }); //user found based on role

  if (clientUser.length > 0) {
    var clientUserAdded = clientUser.length;
  } else {
    var clientUserAdded = 0;
  }

  var clientUserRole = await db.client_roles.findAll({
    where: {
      organization_id: req.body.organization_id,
      role_id: req.body.role_id,
      //user_id: req.body.user_id,
    },
  }); //client user  creation role and organization mapping

  if (clientUserRole.length > 0) {
    var roleUserAdded = clientUserRole.length;
  } else {
    var roleUserAdded = 0;
  }

  var totalUserAdded = clientUserAdded + roleUserAdded;

  if (req.body.role_id == 3) {
    no_client_admin = organizations.dataValues.no_client_admin;
    if (no_client_admin <= clientUser.length) {
      res.send({
        message: "Reached the limit of user",
      });
    } else {
      if (req.body.library) {
        try {
          console.log(req.body);
          db.users
            .create({
              email: req.body.email,
              name: req.body.name,
              role_id: req.body.role_id,
              organization_id:
                req.body.organization_id != ""
                  ? req.body.organization_id
                  : NULL,
              parent_organization_id:
                req.body.parent_organization_id != ""
                  ? req.body.parent_organization_id
                  : NULL,
              status: master.status.active,
              password: password,
              temporary_password: password,
            })
            .then(async (data) => {
              await db.user_role_company.create({
                user_id: data.id,
                role_id: req.body.role_id,
                company_id: req.body.organization_id,
              });

              await db.client_roles.create({
                user_id: data.id,
                role_id: req.body.role_id,
                organization_id: req.body.organization_id,
              });

              messageTmp = await db.msgtemplate.findOne({
                where: {
                  msgtype: "Usercreation",
                },
              });

              let message = messageTmp.dataValues.message;
              message = message.replace("<password>", password);
              //notification Add
              await db.notifications.create({
                message: message,
                user_id: data.id,
                createdBy: req.userId,
              });

              //Email Code

              var mailUsername = master.mailsmtp.username;
              var mailPassword = master.mailsmtp.password;
              var mailFrommail = master.mailsmtp.frommail;

              var transporter = await nodemailer.createTransport({
                host: master.mailsmtp.host,
                port: master.mailsmtp.port,
                secure: master.mailsmtp.secure,
                // requireTLS: true,
                auth: {
                  user: mailUsername,
                  pass: mailPassword,
                },
                tls: {
                  rejectUnauthorized: false,
                },
              });

              var sendMessage = {
                from: `${mailUsername} <${mailFrommail}>`,
                to: req.body.email,
                subject: `User Registration`,
                text: "New Registration",
                html: `<!DOCTYPE html>
                             <html> 
                         <body>
                         </body>
                         ${message}
                         </html>`,
              };

              await transporter.sendMail(sendMessage, (error, info) => {
                if (error) {
                  console.log(error);
                }
              });

              if (req.body.library && req.body.library.length != 0) {
                await req.body.library.forEach((element) => {
                  //console.log(element);
                  db.organization_libraries
                    .create({
                      organization_id: req.body.organization_id,
                      library_id: element,
                      status: master.status.active,
                      archive: master.status.inactive,
                    })
                    .then((libraryData) => {
                      auditCreate.create({
                        user_id: req.userId,
                        table_name: "organization_libraries",
                        primary_id: libraryData.id,
                        event: "create",
                        new_value: libraryData.dataValues,
                        url: req.url,
                        user_agent: req.headers["user-agent"],
                        ip_address: req.connection.remoteAddress,
                      });
                    });
                });
              }
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
      } else {
        try {
          console.log(req.body);
          db.users
            .create({
              email: req.body.email,
              name: req.body.name,
              role_id: req.body.role_id,
              organization_id: req.body.organization_id,
              parent_organization_id: req.body.parent_organization_id,
              status: master.status.active,
              // password: bcrypt.hashSync(req.body.password, 8),
              password: password,
              temporary_password: password,
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
      }
    }
  } else if (req.body.role_id == 4) {
    var no_updator = organizations.dataValues.no_updator;

    if (no_updator <= clientUser.length) {
      res.send({
        message: "Reached the limit of updator",
      });
    } else {
      //updator
      try {
        //console.log(1, req.body);
        db.users
          .create({
            email: req.body.email,
            name: req.body.name,
            role_id: req.body.role_id,
            organization_id:
              req.body.organization_id != "" ? req.body.organization_id : NULL,
            parent_organization_id:
              req.body.parent_organization_id != ""
                ? req.body.parent_organization_id
                : NULL,
            status: master.status.active,
            password: password,
            temporary_password: password,
          })
          .then(async (data) => {
            //console.log(data);
            messageTmp = await db.msgtemplate.findOne({
              where: {
                msgtype: "Usercreation",
              },
            });

            let message = messageTmp.dataValues.message;
            message = message.replace("<password>", password);
            //notification
            await db.notifications.create({
              message: message,
              user_id: data.id,
              createdBy: req.userId,
            });

            //Email Code

            var mailUsername = master.mailsmtp.username;
            var mailPassword = master.mailsmtp.password;
            var mailFrommail = master.mailsmtp.frommail;

            var transporter = await nodemailer.createTransport({
              host: master.mailsmtp.host,
              port: master.mailsmtp.port,
              secure: master.mailsmtp.secure,
              // requireTLS: true,
              auth: {
                user: mailUsername,
                pass: mailPassword,
              },
              tls: {
                rejectUnauthorized: false,
              },
            });

            var sendMessage = {
              from: `${mailUsername} <${mailFrommail}>`,
              to: req.body.email,
              subject: `User Registration`,
              text: "New Registration",
              html: `<!DOCTYPE html>
                           <html> 
                       <body>
                       </body>
                       ${message}
                       </html>`,
            };

            await transporter.sendMail(sendMessage, (error, info) => {
              if (error) {
                console.log(error);
              }
              console.log("mail sent");
            });

            await db.client_roles.create({
              user_id: data.id,
              role_id: req.body.role_id,
              organization_id: req.body.organization_id,
            });

            await db.user_role_company.create({
              user_id: data.id,
              role_id: req.body.role_id,
              company_id: req.body.organization_id,
            });

            if (req.body.substandard_ids.length > 0) {
              // console.log(req.body.substandard_ids.length);
              substandard_ids = req.body.substandard_ids.map((sub) => sub.id);
              let substandard_uniq = await uniq(substandard_ids);


              await helper.addPropertyNotification(req, req.body.substandard_ids, data.id, "substandards");

              // console.log("assign property");
              console.log(substandard_uniq.length);
              let updatorAssignedProps = [];
              let subcount = 0;
              substandard_uniq.forEach((sub_id, key) => {
                db.sequelize
                  .query(
                    `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                    {
                      type: db.sequelize.QueryTypes.SELECT,
                    }
                  )
                  .then((finaldata) => {
                    // console.log(sub_id);
                    //       console.log(finaldata);
                    //      console.log(data.id)
                    subcount = subcount + 1;
                    updatorAssignedProps.push({
                      organization_id: req.body.organization_id,
                      library_id: finaldata[0].library_id,
                      chapter_id: finaldata[0].chapter_id,
                      standard_id: finaldata[0].standard_id,
                      substandard_id: finaldata[0].id,
                      client_id: req.body.client_id,
                      user_id: data.id,
                      role_id: req.body.role_id,
                    });
                    //     console.log(updatorAssignedProps);

                    if (substandard_uniq.length == subcount) {
                      console.log(updatorAssignedProps);
                      db.property_mapping
                        .bulkCreate(updatorAssignedProps)
                        .then((result) => res.send("created"));
                    }
                  });
              });
            } else {
              res.send(data);
            }
          })
          .catch((error) => {
            //logger.info("/error", error);
            console.log(error);
            res.send(error);
          });
      } catch (error) {
        logger.info("/error", error);
        console.log(error);
        res.send(error);
      }
    }
  } else if (req.body.role_id == 5) {
    var no_surveyor = organizations.dataValues.no_surveyor;

    if (no_surveyor <= clientUser.length) {
      res.send({
        message: "Reached the limit of surveyor",
      });
    } else {
      //surveyor

      try {
        //console.log(req.body)

        if (req.body.surveyor_category.length > 0) {
          var surveyor_category = req.body.surveyor_category.toString();
        } else {
          var surveyor_category = req.body.surveyor_category;
        }

        if (req.body.surveyor_session.length > 0) {
          var surveyor_session = req.body.surveyor_session.toString();
        } else {
          var surveyor_session = req.body.surveyor_session;
        }

        db.users
          .create({
            email: req.body.email,
            name: req.body.name,
            role_id: req.body.role_id,
            organization_id:
              req.body.organization_id != "" ? req.body.organization_id : NULL,
            parent_organization_id:
              req.body.parent_organization_id != ""
                ? req.body.parent_organization_id
                : NULL,
            status: master.status.active,
            password: password,
            temporary_password: password,
            surveyor_category:
              req.body.surveyor_category != "" ? surveyor_category : null,
            surveyor_type: req.body.surveyor_type,
            surveyor_session:
              req.body.surveyor_session != "" ? surveyor_session : null,
            to_date: req.body.to_date != "" ? req.body.to_date : null,
            from_date: req.body.from_date != "" ? req.body.from_date : null,
          })
          .then(async (data) => {
            // if (req.body.surveyor_category.length > 0) {
            //   req.body.surveyor_category.forEach((surveyor_category_id, key) => {

            messageTmp = await db.msgtemplate.findOne({
              where: {
                msgtype: "Usercreation",
              },
            });

            let message = messageTmp.dataValues.message;
            message = message.replace("<password>", password);
            //notification
            await db.notifications.create({
              message: message,
              user_id: data.id,
              createdBy: req.userId,
            });

            //Email Code
            var mailUsername = master.mailsmtp.username;
            var mailPassword = master.mailsmtp.password;
            var mailFrommail = master.mailsmtp.frommail;

            var transporter = await nodemailer.createTransport({
              host: master.mailsmtp.host,
              port: master.mailsmtp.port,
              secure: master.mailsmtp.secure,
              // requireTLS: true,
              auth: {
                user: mailUsername,
                pass: mailPassword,
              },
              tls: {
                rejectUnauthorized: false,
              },
            });

            var sendMessage = {
              from: `${mailUsername} <${mailFrommail}>`,
              to: req.body.email,
              subject: `User Registration`,
              text: "New Registration",
              html: `<!DOCTYPE html>
                           <html> 
                       <body>
                       </body>
                       ${message}
                       </html>`,
            };

            await transporter.sendMail(sendMessage, (error, info) => {
              if (error) {
                console.log(error);
              }
            });

            await db.user_role_company.create({
              user_id: data.id,
              role_id: req.body.role_id,
              company_id: req.body.organization_id,
              surveyor_category:
                req.body.surveyor_category != "" ? surveyor_category : null,
              surveyor_type: req.body.surveyor_type,
              surveyor_session:
                req.body.surveyor_session != "" ? surveyor_session : null,
              to_date: req.body.to_date != "" ? req.body.to_date : null,
              from_date: req.body.from_date != "" ? req.body.from_date : null,
            });

            await db.client_roles.create({
              user_id: data.id,
              role_id: req.body.role_id,
              organization_id: req.body.organization_id,
            });
            //   })
            // }
            surveyorSessions = req.body.surveyor_session;
            surveyorAssignedProps = [];
            if (surveyorSessions.length > 0) {
              for (const surveyorsession of surveyorSessions) {
                let standardList = await db.sequelize.query(
                  `SELECT A.id as substandard_id,standard_id,chapter_id  FROM sub_standards as A 
            left join standards as B on A.standard_id = B.id
            left join chapters as C on B.chapter_id = C.id
            where C.library_id=${req.body.properties.library_id} && session_class_id like "%${surveyorsession}%"`,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                );

                if (standardList.length > 0) {
                  standardList.forEach((element) => {
                    req.body.substandard_ids.push(element.substandard_id);
                    //   surveyorAssignedProps.push({
                    //     organization_id: req.body.organization_id,
                    //     library_id: req.body.properties.library_id,
                    //     chapter_id: element.chapter_id,
                    //     standard_id: element.standard_id,
                    //     substandard_id: element.substandard_id,
                    //     client_id: req.body.client_id,
                    //     user_id: data.id,
                    //     role_id: req.body.role_id,
                    //   });
                  });

                  // await db.property_mapping.bulkCreate(surveyorAssignedProps);
                }
              }
            }

            if (
              req.body.substandard_ids &&
              req.body.substandard_ids.length > 0
            ) {
              await helper.addPropertyNotification(req, req.body.surveyor_session, data.id, "session");
              surveyorAssignedProps = [];
              let substandard_uniq = await uniq(req.body.substandard_ids);
              console.log(substandard_uniq.length);
              let subcount = 0;

              substandard_uniq.forEach((sub_id, key) => {
                db.sequelize
                  .query(
                    `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                    {
                      type: db.sequelize.QueryTypes.SELECT,
                    }
                  )
                  .then((finaldata) => {
                    // console.log(sub_id);
                    //      console.log(data.id)
                    subcount = subcount + 1;
                    if (finaldata) {
                      surveyorAssignedProps.push({
                        organization_id: req.body.organization_id,
                        library_id: finaldata[0].library_id,
                        chapter_id: finaldata[0].chapter_id,
                        standard_id: finaldata[0].standard_id,
                        substandard_id: finaldata[0].id,
                        client_id: req.body.client_id,
                        user_id: data.id,
                        role_id: req.body.role_id,
                      });
                    }

                    //     console.log(updatorAssignedProps);

                    if (substandard_uniq.length == subcount) {
                      //console.log(surveyorAssignedProps);
                      db.property_mapping
                        .bulkCreate(surveyorAssignedProps)
                        .then((result) => res.send(data));
                    }
                  });
              });
            } else {
              res.send(data);
            }
          })
          .catch((error) => {
            console.log(error);
            logger.info("/error", error);
            res.send(error);
          });
      } catch (error) {
        console.log(error);
        logger.info("/error", error);

        res.send(error);
      }
    }
  } else if (req.body.role_id == 6) {
    var no_viewer = organizations.dataValues.no_viewer;

    if (no_viewer == totalUserAdded) {
      res.send({
        message: "Reached the limit of viewer",
      });
    } else {
      //viewer

      try {
        // console.log(req.body);
        db.users
          .create({
            email: req.body.email,
            name: req.body.name,
            role_id: req.body.role_id,
            organization_id:
              req.body.organization_id != "" ? req.body.organization_id : NULL,
            parent_organization_id:
              req.body.parent_organization_id != ""
                ? req.body.parent_organization_id
                : NULL,
            status: master.status.active,
            password: password,
            temporary_password: password,
          })
          .then(async (data) => {
            messageTmp = await db.msgtemplate.findOne({
              where: {
                msgtype: "Usercreation",
              },
            });

            let message = messageTmp.dataValues.message;
            message = message.replace("<password>", password);
            //notification
            await db.notifications.create({
              message: message,
              user_id: data.id,
              createdBy: req.userId,
            });
            //mail
            var mailUsername = master.mailsmtp.username;
            var mailPassword = master.mailsmtp.password;
            var mailFrommail = master.mailsmtp.frommail;

            var transporter = await nodemailer.createTransport({
              host: master.mailsmtp.host,
              port: master.mailsmtp.port,
              secure: master.mailsmtp.secure,
              // requireTLS: true,
              auth: {
                user: mailUsername,
                pass: mailPassword,
              },
              tls: {
                rejectUnauthorized: false,
              },
            });

            var sendMessage = {
              from: `${mailUsername} <${mailFrommail}>`,
              to: req.body.email,
              subject: `User Registration`,
              text: "New Registration",
              html: `<!DOCTYPE html>
                           <html> 
                       <body>
                       </body>
                       ${message}
                       </html>`,
            };

            await transporter.sendMail(sendMessage, (error, info) => {
              if (error) {
                console.log(error);
              }
            });

            await db.user_role_company.create({
              user_id: data.id,
              role_id: req.body.role_id,
              company_id: req.body.organization_id,
            });

            await db.client_roles.create({
              user_id: data.id,
              role_id: req.body.role_id,
              organization_id: req.body.organization_id,
            });
            if (
              req.body.substandard_ids &&
              req.body.substandard_ids.length > 0
            ) {
              viewerAssignedProps = [];
              substandard_ids = req.body.substandard_ids.map((sub) => sub.id);
              let substandard_uniq = await uniq(substandard_ids);
              // console.log(substandard_uniq.length);
              await helper.addPropertyNotification(req, req.body.substandard_ids, data.id, "substandards");
              let subcount = 0;
              substandard_uniq.forEach((sub_id, key) => {
                db.sequelize
                  .query(
                    `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                    {
                      type: db.sequelize.QueryTypes.SELECT,
                    }
                  )
                  .then((finaldata) => {
                    // console.log(sub_id);
                    subcount = subcount + 1;
                    console.log(finaldata);
                    //      console.log(data.id)
                    viewerAssignedProps.push({
                      organization_id: req.body.organization_id,
                      library_id: finaldata[0].library_id,
                      chapter_id: finaldata[0].chapter_id,
                      standard_id: finaldata[0].standard_id,
                      substandard_id: finaldata[0].id,
                      client_id: req.body.client_id,
                      user_id: data.id,
                      role_id: req.body.role_id,
                    });
                    //     console.log(updatorAssignedProps);

                    if (substandard_uniq.length == subcount) {
                      console.log(viewerAssignedProps.length);
                      console.log(viewerAssignedProps);
                      db.property_mapping
                        .bulkCreate(viewerAssignedProps)
                        .then((result) => res.send(data));
                    }
                  });
              });
            } else {
              res.send(data);
            }
          })
          .catch((error) => {
            logger.info("/error", error);

            res.send(error);
          });
      } catch (error) {
        logger.info("/error", error);

        res.send(error);
      }
    }
  }
};

exports.showPropertyByUserCompany = async (req, res) => {
  userRoleCompany = await db.user_role_company.findOne({
    where: {
      id: req.params.id,
    },
  });
};
exports.clientuserupdate2 = async (req, res) => {
  if (req.body.role_id == 3) {
    userRoleCompany = await db.user_role_company.findOne({
      where: {
        id: req.body.id,
      },
    });

    await db.user_role_company.update(
      {
        role_id: req.body.role_id,
        company_id: req.body.organization_id,
      },
      {
        where: {
          id: req.body.id,
        },
      }
    );

    await db.client_roles.update(
      {
        role_id: req.body.role_id,
        organization_id: req.body.organization_id,
      },
      {
        where: {
          user_id: userRoleCompany.user_id,
          role_id: userRoleCompany.role_id,
          organization_id: userRoleCompany.company_id,
        },
      }
    );

    res.send("updated");
  } else if (req.body.role_id == 4) {
    userRoleCompany = await db.user_role_company.findOne({
      where: {
        id: req.body.id,
      },
    });

    await db.user_role_company.update(
      {
        role_id: req.body.role_id,
        company_id: req.body.organization_id,
      },
      {
        where: {
          id: req.body.id,
        },
      }
    );

    await db.client_roles.update(
      {
        role_id: req.body.role_id,
        organization_id: req.body.organization_id,
      },
      {
        where: {
          user_id: userRoleCompany.user_id,
          role_id: userRoleCompany.role_id,
          organization_id: userRoleCompany.company_id,
        },
      }
    );

    res.send("updated");
  } else if (req.body.role_id == 5) {
    userRoleCompany = await db.user_role_company.findOne({
      where: {
        id: req.body.id,
      },
    });

    if (req.body.surveyor_category.length > 0) {
      var surveyor_category = req.body.surveyor_category.toString();
    } else {
      var surveyor_category = req.body.surveyor_category;
    }

    if (req.body.surveyor_session.length > 0) {
      var surveyor_session = req.body.surveyor_session.toString();
    } else {
      var surveyor_session = req.body.surveyor_session;
    }

    userRoleCompanyUpdate = await db.user_role_company.update(
      {
        role_id: req.body.role_id,
        company_id: req.body.organization_id,
        surveyor_category:
          req.body.surveyor_category != "" ? surveyor_category : null,
        surveyor_type: req.body.surveyor_type,
        surveyor_session:
          req.body.surveyor_session != "" ? surveyor_session : null,
        to_date: req.body.to_date != "" ? req.body.to_date : null,
        from_date: req.body.from_date != "" ? req.body.from_date : null,
      },
      {
        where: {
          id: req.body.id,
        },
      }
    );

    await db.client_roles.update(
      {
        role_id: req.body.role_id,
        organization_id: req.body.organization_id,
      },
      {
        where: {
          user_id: userRoleCompany.user_id,
          role_id: userRoleCompany.role_id,
          organization_id: userRoleCompany.company_id,
        },
      }
    );

    res.send("updated");
  } else if (req.body.role_id == 6) {
    userRoleCompany = await db.user_role_company.findOne({
      where: {
        id: req.body.id,
      },
    });

    await db.user_role_company.update(
      {
        role_id: req.body.role_id,
        company_id: req.body.organization_id,
      },
      {
        where: {
          id: req.body.id,
        },
      }
    );

    await db.client_roles.update(
      {
        role_id: req.body.role_id,
        organization_id: req.body.organization_id,
      },
      {
        where: {
          user_id: userRoleCompany.user_id,
          role_id: userRoleCompany.role_id,
          organization_id: userRoleCompany.company_id,
        },
      }
    );

    res.send("updated");
  }
};

exports.clientAdminUserupdate = async (req, res) => {
 
  if (req.body.role_id == 2) {
    // 1 SA 2 CSA 3 CA 4 Updator 5 surveyor 6 viewer
    try {
      //  console.log(req.body);
      db.users
        .update(
          {
            //  email: req.body.email,
            name: req.body.name,
          },
          { where: { id: req.body.id } }
        )
        .then(async (data) => {
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
  }
  if (req.body.role_id == 3) {
    // 1 SA 2 CSA 3 CA 4 Updator 5 surveyor 6 viewer
    try {
      // console.log(req.body);

      let checkuser = await db.users.findAll({
        where: {
          email: req.body.email,
          id: {
            [Op.ne]: req.body.id,
          },
        },
      });

      if (checkuser.length == 0) {
        let emailprops = {};
        checkuser = await db.users.findAll({
          where: {
            email: req.body.email,
            id: {
              [Op.eq]: req.body.id,
            },
          },
        });

        if (checkuser.length == 0) {
          emailprops.email = req.body.email;
        }

        let users = await db.users.update(
          {
            ...emailprops,
            name: req.body.name,
          },
          { where: { id: req.body.id } }
        );
      } else {
        return res.status(401).send("User Already Exist");
      }

      if (req.body.library && req.body.library.length != 0) {
        // console.log(req.body.library);
        let idx = 0;
        for (const element of req.body.library) {
          await db.organization_libraries.findOrCreate({
            where: {
              organization_id: req.body.organization_id,
              library_id: element,
              status: master.status.active,
            },
          });

          if (req.body.library.length == idx + 1) {
            // console.log(idx + 1);
            res.send(users);
          }
          idx = idx + 1;
        }
      } else {
        res.send(users);
      }
    } catch (error) {
      logger.info("/error", error);
      res.send(error);
    }
  } else if (req.body.role_id == 4) {
    //updator
    try {
      let checkuser = await db.users.findAll({
        where: {
          email: req.body.email,
          id: {
            [Op.ne]: req.body.id,
          },
        },
      });

      if (checkuser.length == 0) {
        let emailprops = {};
        checkuser = await db.users.findAll({
          where: {
            email: req.body.email,
            id: {
              [Op.eq]: req.body.id,
            },
          },
        });

        if (checkuser.length == 0) {
          emailprops.email = req.body.email;
        }

        db.users
          .update(
            {
              ...emailprops,
              name: req.body.name,
            },
            { where: { id: req.body.id } }
          )
          .then(async (data) => {
            
            if (
              req.body.remove_substandard_ids &&
              req.body.remove_substandard_ids.length > 0
            ) {
              let removesubstandard_uniq_arr = await uniq(
                req.body.remove_substandard_ids
              );
 

              removesubstandard_uniq = await helper.checkSubstandardDeleteStatus(req, removesubstandard_uniq_arr, req.body.role_id, req.body.id);
               

              if(removesubstandard_uniq_arr.length > removesubstandard_uniq) {
                return res.status(401).send({message : "Unable to delete the standard since the assessment already updated"})
              }

              if (removesubstandard_uniq.length > 0) {
                await db.property_mapping.destroy({
                  where: {
                    organization_id: req.body.organization_id,
                    user_id: req.body.id,
                    role_id: req.body.role_id,
                    substandard_id: {
                      [Op.in]: removesubstandard_uniq,
                    },
                  },
                });
              }

            }

       

            let sub_standard_ids = await db.property_mapping
              .findAll({
                where: {
                  organization_id: req.organization_id,
                  user_id: req.body.id,
                  role_id: req.body.role_id,
                },
              })
              .then((results) =>
                results.map((result) => result.substandard_id)
              );

            if (req.body.substandard_id && req.body.substandard_id.length > 0) {
              substandard_ids = req.body.substandard_id.filter(
                (el) => !sub_standard_ids.includes(el)
              );

              if (substandard_ids.length > 0) {
                let substandard_uniq = await uniq(substandard_ids);
                await helper.addPropertyNotificationUpdate(req, substandard_ids, req.body.id, "substandards");
                let updatorAssignedProps = [];
                let subcount = 0;
                substandard_uniq.forEach((sub_id, key) => {
                  db.sequelize
                    .query(
                      `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                      {
                        type: db.sequelize.QueryTypes.SELECT,
                      }
                    )
                    .then((finaldata) => {
                      subcount = subcount + 1;
                      updatorAssignedProps.push({
                        organization_id: req.body.organization_id,
                        library_id: finaldata[0].library_id,
                        chapter_id: finaldata[0].chapter_id,
                        standard_id: finaldata[0].standard_id,
                        substandard_id: finaldata[0].id,
                        client_id: req.userId,
                        user_id: req.body.id,
                        role_id: req.body.role_id,
                      });
                      // console.log(updatorAssignedProps);

                      if (substandard_uniq.length == subcount) {
                        db.property_mapping
                          .bulkCreate(updatorAssignedProps)
                          .then((result) => res.send("updated"));
                      }
                    });
                });
              } else {
                res.send(data);
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
      } else {
        return res.status(401).send("User Already Exist");
      }
    } catch (error) {
      console.log(error);
      logger.info("/error", error);

      res.send(error);
    }
  } else if (req.body.role_id == 5) {
    let surveyor_category = "";
    let surveyor_session = "";
    if (req.body.surveyor_category.length > 0) {
      surveyor_category = req.body.surveyor_category.toString();
    } else {
      surveyor_category = req.body.surveyor_category;
    }

    if (req.body.surveyor_session.length > 0) {
      surveyor_session = req.body.surveyor_session.toString();
    } else {
      surveyor_session = req.body.surveyor_session;
    }

    //surveyor
    try {
      // console.log(req.body);

      let checkuser = await db.users.findAll({
        where: {
          email: req.body.email,
          id: {
            [Op.ne]: req.body.id,
          },
        },
      });

      if (checkuser.length == 0) {
        let emailprops = {};
        checkuser = await db.users.findAll({
          where: {
            email: req.body.email,
            id: {
              [Op.eq]: req.body.id,
            },
          },
        });

        if (checkuser.length == 0) {
          emailprops.email = req.body.email;
        }

        db.users
          .update(
            {
              ...emailprops,
              name: req.body.name,
              surveyor_category:
                req.body.surveyor_category != "" ? surveyor_category : null,
              surveyor_type: req.body.surveyor_type,
              surveyor_session:
                req.body.surveyor_session != "" ? surveyor_session : null,
              from_date: req.body.from_date,
              to_date: req.body.to_date
            },
            { where: { id: req.body.id } }
          )
          .then(async (data) => {
            if (
              req.body.remove_substandard_ids &&
              req.body.remove_substandard_ids.length > 0
            ) {
              let removesubstandard_uniq_arr = await uniq(
                req.body.remove_substandard_ids
              );

              removesubstandard_uniq = await helper.checkSubstandardDeleteStatus(req, removesubstandard_uniq_arr, req.body.role_id, req.body.id);

              if(removesubstandard_uniq_arr.length > removesubstandard_uniq) {
                return res.status(401).send({message : "Unable to delete the standard since the assessment already updated"})
              }

              if (removesubstandard_uniq.length > 0) {
                await db.property_mapping.destroy({
                  where: {
                    organization_id: req.organization_id,
                    user_id: req.body.id,
                    role_id: req.body.role_id,
                    substandard_id: {
                      [Op.in]: removesubstandard_uniq,
                    },
                  },
                });
              }

            }

            let sub_standard_ids = await db.property_mapping
              .findAll({
                where: {
                  organization_id: req.organization_id,
                  user_id: req.body.id,
                  role_id: req.body.role_id,
                },
              })
              .then((results) =>
                results.map((result) => result.substandard_id)
              );

            let surveyorSessions = req.body.new_surveyor_session;

            if (surveyorSessions.length > 0) {
              await helper.addPropertyNotification(req, surveyorSessions, req.body.id, "session");
              for (const surveyorsession of surveyorSessions) {
                let standardList = await db.sequelize.query(
                  `SELECT A.id as substandard_id,standard_id,chapter_id  FROM sub_standards as A 
          left join standards as B on A.standard_id = B.id
          left join chapters as C on B.chapter_id = C.id
          where C.library_id=${req.body.library[0]} && session_class_id like "%${surveyorsession}%"`,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                );

                if (standardList.length > 0) {
                  standardList.forEach((element) => {
                    req.body.substandard_id.push(element.substandard_id);
                  });
                }
              }
            }

            // console.log(req.body.substandard_id);

            if (req.body.substandard_id && req.body.substandard_id.length > 0) {
              let substandard_ids = req.body.substandard_id.filter(
                (el) => !sub_standard_ids.includes(el)
              );

              if (substandard_ids.length > 0) {
                let substandard_uniq = await uniq(substandard_ids);
                // console.log("assign property");
                //  console.log(substandard_uniq.length);
                let updatorAssignedProps = [];
                let subcount = 0;
                substandard_uniq.forEach((sub_id, key) => {
                  db.sequelize
                    .query(
                      `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                      {
                        type: db.sequelize.QueryTypes.SELECT,
                      }
                    )
                    .then((finaldata) => {
                      // console.log(sub_id);
                      //       console.log(finaldata);
                      //      console.log(data.id)
                      subcount = subcount + 1;
                      if (finaldata.length > 0) {
                        updatorAssignedProps.push({
                          organization_id: req.body.organization_id,
                          library_id: finaldata[0].library_id,
                          chapter_id: finaldata[0].chapter_id,
                          standard_id: finaldata[0].standard_id,
                          substandard_id: finaldata[0].id,
                          client_id: req.userId,
                          user_id: req.body.id,
                          role_id: req.body.role_id,
                        });
                      }

                      //     console.log(updatorAssignedProps);

                      if (substandard_uniq.length == subcount) {
                        console.log(updatorAssignedProps);
                        db.property_mapping
                          .bulkCreate(updatorAssignedProps)
                          .then((result) => res.send("updated"));
                      }
                    });
                });
              } else {
                res.send(data);
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
      } else {
        return res.status(401).send("User Already Exist");
      }
    } catch (error) {
      console.log(error);
      logger.info("/error", error);

      res.send(error);
    }
  } else if (req.body.role_id == 6) {
    //viewer
    try {
      //  console.log(req.body);

      let newSubstandardList = [];

      let checkuser = await db.users.findAll({
        where: {
          email: req.body.email,
          id: {
            [Op.ne]: req.body.id,
          },
        },
      });

      if (checkuser.length == 0) {
        let emailprops = {};
        checkuser = await db.users.findAll({
          where: {
            email: req.body.email,
            id: {
              [Op.eq]: req.body.id,
            },
          },
        });

        if (checkuser.length == 0) {
          emailprops.email = req.body.email;
        }

        db.users
          .update(
            {
              ...emailprops,
              name: req.body.name,
              role_id: req.body.role_id,
            },
            { where: { id: req.body.id } }
          )
          .then(async (data) => {
            if (
              req.body.remove_substandard_ids &&
              req.body.remove_substandard_ids.length > 0
            ) {
              let removesubstandard_uniq = await uniq(
                req.body.remove_substandard_ids
              );
              await db.property_mapping.destroy({
                where: {
                  organization_id: req.organization_id,
                  user_id: req.body.id,
                  role_id: req.body.role_id,
                  substandard_id: {
                    [Op.in]: removesubstandard_uniq,
                  },
                },
              });
            }

            let sub_standard_ids = await db.property_mapping
              .findAll({
                where: {
                  organization_id: req.organization_id,
                  user_id: req.body.id,
                  role_id: req.body.role_id,
                },
              })
              .then((results) =>
                results.map((result) => result.substandard_id)
              );

            if (req.body.substandard_id && req.body.substandard_id.length > 0) {
              let substandard_ids = req.body.substandard_id.filter(
                (el) => !sub_standard_ids.includes(el)
              );

              if (substandard_ids.length > 0) {
                let substandard_uniq = await uniq(substandard_ids);
                await helper.addPropertyNotificationUpdate(req, substandard_uniq, req.body.id, "Substandard");
                // console.log("assign property");
                console.log(substandard_uniq.length);
                let updatorAssignedProps = [];
                let subcount = 0;
                substandard_uniq.forEach((sub_id, key) => {
                  db.sequelize
                    .query(
                      `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                      {
                        type: db.sequelize.QueryTypes.SELECT,
                      }
                    )
                    .then((finaldata) => {
                      // console.log(sub_id);
                      //       console.log(finaldata);
                      //      console.log(data.id)
                      subcount = subcount + 1;
                      updatorAssignedProps.push({
                        organization_id: req.body.organization_id,
                        library_id: finaldata[0].library_id,
                        chapter_id: finaldata[0].chapter_id,
                        standard_id: finaldata[0].standard_id,
                        substandard_id: finaldata[0].id,
                        client_id: req.userId,
                        user_id: req.body.id,
                        role_id: req.body.role_id,
                      });
                      //     console.log(updatorAssignedProps);

                      if (substandard_uniq.length == subcount) {
                        // console.log(updatorAssignedProps);

                        db.property_mapping
                          .bulkCreate(updatorAssignedProps)
                          .then((result) => res.send(data));
                      }
                    });
                });
              } else {
                res.send(data);
              }
            } else {
              res.send(data);
            }
          })
          .catch((error) => {
            logger.info("/error", error);
            res.send(error);
          });
      } else {
        return res.status(401).send("User Already Exist");
      }
    } catch (error) {
      logger.info("/error", error);
      res.send(error);
    }
  }
};

exports.clientUsersWithProperties = async (req, res) => {

  const updator_id = req.body.updator_id;
  const internal_surveyor_id = req.body.internal_surveyor_id;
  const external_surveyor_id = req.body.external_surveyor_id;
  let allUsers = null;
  let filterByUser = [];

  if (updator_id) {
    filterByUser.push(updator_id)
  }

  if (internal_surveyor_id) {
    filterByUser.push(internal_surveyor_id)
  }

  if (external_surveyor_id) {
    filterByUser.push(external_surveyor_id)
  }

  if (filterByUser) {

    const assignedProps = await db.property_mapping.findAll({
      where: {
        organization_id: req.organization_id,
        user_id: {
          [Op.in]: filterByUser
        },
      },
      raw: true
    });

    if (assignedProps.length > 0) {
      let matchSubs = [];
      if (filterByUser.length >= 2) {
        let user1 = assignedProps.filter(el => el.user_id == filterByUser[0]).map(el => el.substandard_id);
        let user2 = assignedProps.filter(el => el.user_id == filterByUser[1]).map(el => el.substandard_id);

        matchSubs.push(...helper.arrayMatch(user1, user2))
      }
      else {
        let user1 = assignedProps.filter(el => el.user_id == filterByUser[0]).map(el => el.substandard_id);
        matchSubs.push(...user1);

      }

      let quotedAndCommaSeparated = "'" + matchSubs.join("','") + "'";

      let users = await db.sequelize.query(`select B.* from property_mapping as A inner join users as B on A.user_id=B.id && A.organization_id=${req.organization_id} where 
          substandard_id in(${quotedAndCommaSeparated}) group by B.id `, {
        type: db.sequelize.QueryTypes.SELECT
      });
      res.status(200).send(users);
    }
    else {
      allUsers = await db.users.findAll({
        where: {
          organization_id: req.organization_id
        }
      });

      res.status(200).send(allUsers);
    }
  } else {
    allUsers = await db.users.findAll({
      where: {
        organization_id: req.organization_id
      }
    });

    res.status(200).send(allUsers);
  }


}

exports.passwordset = async (req, res) => {
  let token = req.headers["authorization"];
  TokenArray = token.split(" ");
  token = TokenArray[1];
  console.log(jwt.decode(TokenArray[1]), 11);
  if (req.body.password == req.body.retype_password) {
    console.log(req.body);
    db.users
      .update(
        {
          password: req.body.password,
        },
        {
          where: { id: jwt.decode(TokenArray[1]).id },
          individualHooks: true,
        }
      )
      .then((data) => res.send(data))
      .catch((error) => {
        res.send(error);
      });
  }
};

exports.forgot = async (req, res) => {
  var password = generator.generate({
    length: 20,
    numbers: true,
    uppercase: true,
    lowercase: true,
    strict: true,
    symbols: true,
    exclude: `<>&"':#$`,
  });

  db.users
    .findOne({
      where: {
        email: req.body.email,
      },
    })
    .then(async (user) => {
      if (!user) {
        return res.status(404).send("Email Not Found.");
      }
      var token = jwt.sign(
        { id: user.id, email: req.body.email },
        config.secret,
        { expiresIn: 1800 }
      );

      //var baseUrl = "localhost/4200/reset-password"
      var baseUrl = "https://accreproweb.astirs.com/reset-password";

      var url = "" + baseUrl + "?token=" + token + " ";

      var custObj = {
        email: req.body.email,
        name: user.name,
        token: token,
        url: url,
      };

      // var frommail = master.basic.frommail;
      // var fromname = master.basic.fromname;

      var mailUsername = master.mailsmtp.username;
      var mailPassword = master.mailsmtp.password;
      var mailFrommail = master.mailsmtp.frommail;

      // var transporter = await nodemailer.createTransport({
      //   host: "smtp.gmail.com",
      //   port: 587,
      //   secure: false,
      //   requireTLS: true,
      //   auth: {
      //     user: master.basic.frommail,
      //     pass: master.basic.mailpassword,
      //   },
      // });

      var transporter = await nodemailer.createTransport({
        host: master.mailsmtp.host,
        port: master.mailsmtp.port,
        secure: master.mailsmtp.secure,
        // requireTLS: true,
        auth: {
          user: mailUsername,
          pass: mailPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      var message = {
        from: `${mailUsername} <${mailFrommail}>`,
        to: req.body.email,
        subject: `Forgot password? Reset it`,
        text: "Two step verification",
        html:
          `<!DOCTYPE html>
                   <html> 
               <table>
               <tr class="mail-content">
               <td>
               <h4>Dear ${custObj.name.charAt(0).toUpperCase() + custObj.name.slice(1)
          },</h4>
               </td>
               </tr>
               <tr>
               <td class="content-text">
               <p>We have recently received a request to change the password for your account.\n\n` +
          `If you have requested this change, please click the link:\n\n` +
          `<a href="${custObj.url}">Reset Password here</a>\n\n` +
          `In case you have not authorized this action, please ignore this email and your password will remain the same.\n</p></td>
               </tr>
               </table>
               </body>
               
               </html>`,
      };

      transporter.sendMail(message, (error, info) => {
        if (error) {
          return console.log(error);
        }
        res.status(200).send({
          auth: true,
          email: req.body.email,
          message: "link sent to email",
          token: token,
        });
        // console.log('Message sent: %s', info.messageId);
        // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      });
    })
    .catch((err) => {
      res.status(500).send("Error -> " + err);
    });
};

exports.forgotFinal = async (req, res) => {
  let token = req.headers["authorization"];
  TokenArray = token.split(" ");
  token = TokenArray[1];
  var deprecation = jwt.decode(TokenArray[1]);
  // console.log(jwt.decode(TokenArray[1]),new Date(deprecation.exp*1000)<=new Date())
  if (req.body.password == req.body.retypepassword) {
    if (new Date(deprecation.exp * 1000) >= new Date()) {
      db.users
        .update(
          {
            password: req.body.password,
            temporary_password: req.body.password,
          },
          {
            where: {
              email: deprecation.email,
            },
            individualHooks: true,
          }
        )
        .then((data) => {
          res.send({ message: "Password Changed Successfully" });
        })
        .catch((err) => {
          res.status(500).send(err);
        });
    } else {
      res.status(500).send({ message: "Link Expired" });
    }
  } else {
    res
      .status(500)
      .send({ message: "Password and retype password is missmatched" });
  }
};
exports.userforget = async (req, res) => {
  if (req.body.password == req.body.retypepassword) {
    var user = await db.users.findOne({ where: { id: req.body.id } });
    console.log(user);
    var passwordIsValid = bcrypt.compareSync(
      req.body.current_password,
      user.password
    );
    if (!passwordIsValid) {
      return res
        .status(401)
        .send({ auth: false, accessToken: null, reason: "Invalid Password!" });
    }
    console.log(passwordIsValid);
    db.users
      .update(
        {
          password: req.body.password,
          temporary_password: req.body.password,
        },
        {
          where: {
            id: req.body.id,
          },
          individualHooks: true,
        }
      )
      .then((data) => {
        res.send({ message: "Password Changed Successfully" });
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  } else {
    res
      .status(500)
      .send({ message: "Password and retype password is missmatched" });
  }
};
exports.userupdate = async (req, res) => {
  var surveyor_categories = "";

  for (var key in req.body.surveyor_category) {
    if (surveyor_categories === "") {
      surveyor_categories = req.body.surveyor_category[key];
    } else {
      surveyor_categories =
        surveyor_categories + "," + req.body.surveyor_category[key];
    }
  }

  var session_class = "";

  for (var key in req.body.surveyor_session) {
    if (session_class === "") {
      session_class = req.body.surveyor_session[key];
    } else {
      session_class = session_class + "," + req.body.surveyor_session[key];
    }
  }

  db.users
    .update(
      {
        //email: req.body.email,
        name: req.body.name,
        role_id: req.body.role_id,
        organization_id:
          req.body.organization_id !== "" ? req.body.organization_id : NULL,
        parent_organization_id:
          req.body.parent_organization_id != ""
            ? req.body.parent_organization_id
            : NULL,
        status: master.status.active,
        surveyor_category:
          req.body.surveyor_category !== "" ? surveyor_categories : null,
        surveyor_session: session_class !== "" ? session_class : null,
        surveyor_type: req.body.surveyor_type,
        to_date: req.body.to_date !== "" ? req.body.to_date : null,
        from_date: req.body.from_date !== "" ? req.body.from_date : null,
      },
      {
        where: { id: req.body.id },
      }
    )
    .then(async (data) => {
      if (req.body.library && req.body.library.length != 0) {
        await req.body.library.forEach((element) => {
          db.organization_libraries
            .create({
              organization_id: req.body.organization_id,
              library_id: element,
              status: master.status.active,
              archive: master.status.inactive,
            })
            .then((libraryData) => {
              auditCreate.create({
                user_id: req.userId,
                table_name: "organization_libraries",
                primary_id: libraryData.id,
                event: "create",
                new_value: libraryData.dataValues,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });
            });
        });
      }
      res.send(data);
    })
    .catch((error) => {
      logger.info("/error", error);

      res.send(error);
    });
};
