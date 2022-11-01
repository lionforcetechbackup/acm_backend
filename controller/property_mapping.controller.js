const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const helper = require("../util/helper");
exports.create = async (req, res) => {
  try {
    const substandards = req.body.substandard_ids.map((el) => el.id);
    substandards.forEach((sub_id, key) => {
      db.sequelize
        .query(
          `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((finaldata) => {
          //console.log(finaldata);
          db.property_mapping
            .create({
              organization_id: req.headers["organization"],
              library_id: finaldata[0].library_id,
              chapter_id: finaldata[0].chapter_id,
              standard_id: finaldata[0].standard_id,
              substandard_id: finaldata[0].id,
              client_id: req.body.client_id,
              user_id: req.body.user_id,
              status: master.status.active,
              role_id: req.body.role_id,
              role_id: req.body.role_id,
            })
            .then((data) => {
              if (substandards.length == key + 1) {
                res.send("created");
              }
            });
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.singlePropertyAssignstandard = async (req, res) => {
  const substandards = req.body.standard_ids.map((el) => el.id);

  var substandardIds = await db.sub_standards
    .findAll({
      attributes: ["id"],
      where: {
        standard_id: { [Op.in]: substandards },
        status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      //console.log(accounts);
      return accounts.map((account) => account.id);
    })
    .catch((error) => res.send(error));

  if (substandardIds.length > 0) {
    updatorAssignedProps = [];
    substandardIds.forEach((sub_id, key) => {
      db.sequelize
        .query(
          `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((finaldata) => {
          //console.log(finaldata);
          updatorAssignedProps.push({
            organization_id: req.headers["organization"],
            library_id: finaldata[0].library_id,
            chapter_id: finaldata[0].chapter_id,
            standard_id: finaldata[0].standard_id,
            substandard_id: finaldata[0].id,
            client_id: req.body.client_id,
            user_id: req.body.user_id,
            status: master.status.active,
            role_id: 4,
          });

          if (substandardIds.length == key + 1) {
            db.property_mapping
              .bulkCreate(updatorAssignedProps)
              .then((result) => res.send("created"));
          }

          // db.property_mapping
          //   .create({
          //     organization_id: req.headers["organization"],
          //     library_id: finaldata[0].library_id,
          //     chapter_id: finaldata[0].chapter_id,
          //     standard_id: finaldata[0].standard_id,
          //     substandard_id: finaldata[0].id,
          //     client_id: req.body.client_id,
          //     user_id: req.body.user_id,
          //     status: master.status.active,
          //     role_id: req.body.role_id,
          //   })
          //   .then((data) => {
          //     if (substandardIds.length == key + 1) {
          //       res.send("created");
          //     }
          //   });
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    });
  } else {
    res.send("sub-Standard not matched");
  }
};
exports.singlePropertyAssignstandardTemp = async (req, res) => {
  const standards = req.body.standard_ids.map((el) => el.id);
  const assignto = req.body.user_id;
  const expirydate = req.body.expirydate;

  try {
    // const properties = await db.property_mapping.findAll({
    //   where: {
    //     assignto,
    //     expirydate,
    //     standard_id: {
    //       [Op.in]: standards,
    //     },
    //   },
    // });

    await helper.addPropertyNotificationTemp(req,req.body.standard_ids,assignto,"Standard");

    db.property_mapping
      .update(
        {
          assignto: assignto,
          expirydate: expirydate,
        },
        {
          where: {
            standard_id: {
              [Op.in]: standards,
            },
            user_id: req.userId,
            role_id: req.role_id,
            organization_id: req.organization_id,
          },
        }
      )
      .then(() => {
        return res.status(200).send({ msg: "success" });
      })
      .catch((error) => {
        console.log(error);
        return res.status(401).send("error");
      });
  } catch (error) {
    console.log(error);
    return res.status(401).send("Network Error");
  }
};

exports.singlePropertyAssignsubstandardTemp = async (req, res) => {
  const substandards = req.body.substandard_ids.map((el) => el.id);
  const assignto = req.body.user_id;
  const expirydate = req.body.expirydate;

  try {
    // const properties = await db.property_mapping.findAll({
    //   where: {
    //     assignto,
    //     expirydate,
    //     substandard_id: {
    //       [Op.in]: substandards,
    //     },
    //   },
    // });

    // return res.status(200).send("Success");
    await helper.addPropertyNotificationTemp(req,req.body.substandard_ids,assignto,"Substandard");

    db.property_mapping
      .update(
        {
          assignto: assignto,
          expirydate: expirydate,
        },
        {
          where: {
            substandard_id: {
              [Op.in]: substandards,
            },
            user_id: req.userId,
            role_id: req.role_id,
            organization_id: req.organization_id,
          },
        }
      )
      .then(() => {
        return res.status(200).send({ msg: "success" });
      })
      .catch((error) => {
        console.log(error);
        return res.status(401).send("error");
      });
  } catch (error) {
    console.log(error);
    return res.status(401).send("Network Error");
  }
};

exports.propertyAssign = async (req, res) => {
  if (req.body.chapter_id) {
    req.body.chapter_ids.forEach((chapter_id, key) => {
      db.sequelize
        .query(
          `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE chapters.id=${chapter_id}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((finaldata) => {
          if (finaldata.length > 0) {
            for (let index = 0; index < finaldata.length; index++) {
              const elementInsert = finaldata[index];
              db.property_mapping
                .create({
                  organization_id: req.headers["organization"],
                  library_id: elementInsert.library_id,
                  chapter_id: elementInsert.chapter_id,
                  standard_id: elementInsert.standard_id,
                  substandard_id: elementInsert.id,
                  client_id: req.body.client_id,
                  user_id: req.body.user_id,
                  status: master.status.active,
                  role_id: req.body.role_id,
                })
                .then((data) => {
                  if (finaldata.length == index + 1) {
                    if (req.body.chapter_ids.length == key + 1) {
                      res.send("created");
                    } else {
                      return true;
                    }
                  }
                })
                .catch((error) => {
                  //console.log("hu")
                  res.send(error);
                });
            }
          } else {
            res.send("No substandard found");
          }
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    });
  } else if (req.body.substandard_id) {
    if (req.body.substandard_id.length > 0) {
      try {
        req.body.substandard_id.forEach((sub_id, key) => {
          db.sequelize
            .query(
              `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id=${sub_id}`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            )
            .then((finaldata) => {
              //console.log(finaldata);
              db.property_mapping
                .create({
                  organization_id: req.headers["organization"],
                  library_id: finaldata[0].library_id,
                  chapter_id: finaldata[0].chapter_id,
                  standard_id: finaldata[0].standard_id,
                  substandard_id: finaldata[0].id,
                  client_id: req.body.client_id,
                  user_id: req.body.user_id,
                  status: master.status.active,
                  role_id: req.body.role_id,
                  role_id: req.body.role_id,
                })
                .then((data) => {
                  if (req.body.substandard_ids.length == key + 1) {
                    res.send("created");
                  }
                });
            })
            .catch((error) => {
              logger.info("/error", error);
              res.send(error);
            });
        });
      } catch (error) {
        logger.info("/error", error);
        res.send(error);
      }
    }
  } else if (req.body.standard_id) {
    if (req.body.standard_id.length > 0) {
      req.body.standard_id.forEach((sub_id, key) => {
        db.sequelize
          .query(
            `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id=${sub_id}`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          )
          .then((finaldata) => {
            //console.log(finaldata);
            db.property_mapping
              .create({
                organization_id: req.headers["organization"],
                library_id: finaldata[0].library_id,
                chapter_id: finaldata[0].chapter_id,
                standard_id: finaldata[0].standard_id,
                substandard_id: finaldata[0].id,
                client_id: req.body.client_id,
                user_id: req.body.user_id,
                status: master.status.active,
                role_id: req.body.role_id,
              })
              .then((data) => {
                if (req.body.standard_id.length == key + 1) {
                  res.send("created");
                }
              });
          })
          .catch((error) => {
            logger.info("/error", error);
            res.send(error);
          });
      });
    } else {
      res.send("sub-Standard not matched");
    }
  } else {
    res.send("No Data");
  }
};
exports.singlePropertyAssignchapter = async (req, res) => {
  //console.log(111111111111,req.headers['organization'],req.body.chapter_ids)

  /*checkchapter = await db.property_mapping.findAll({
    where: {
      role_id: 4,
      chapter_id: req.body.chapter_ids,
    },
  });
  console.log(checkchapter);
  return; */

  const chapters = req.body.chapter_ids.map((el) => el.id);

  chapters.forEach((chapter_id, key) => {
    db.sequelize
      .query(
        `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE chapters.id='${chapter_id}'`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then((finaldata) => {
        if (finaldata.length > 0) {
          updatorAssignedProps = [];
          for (let index = 0; index < finaldata.length; index++) {
            const elementInsert = finaldata[index];

            updatorAssignedProps.push({
              organization_id: req.headers["organization"],
              library_id: elementInsert.library_id,
              chapter_id: elementInsert.chapter_id,
              standard_id: elementInsert.standard_id,
              substandard_id: elementInsert.id,
              client_id: req.body.client_id,
              user_id: req.body.user_id,
              status: master.status.active,
              role_id: 4,
            });

            if (finaldata.length == index + 1) {
              if (chapters.length == key + 1) {
                db.property_mapping
                  .bulkCreate(updatorAssignedProps)
                  .then((result) => res.send("created"));
              } else {
                return true;
              }
            }

            // db.property_mapping
            //   .create({
            //     organization_id: req.headers["organization"],
            //     library_id: elementInsert.library_id,
            //     chapter_id: elementInsert.chapter_id,
            //     standard_id: elementInsert.standard_id,
            //     substandard_id: elementInsert.id,
            //     client_id: req.body.client_id,
            //     user_id: req.body.user_id,
            //     status: master.status.active,
            //     role_id: req.body.role_id,
            //   })
            //   .then((data) => {
            //     if (finaldata.length == index + 1) {
            //       if (req.body.chapter_ids.length == key + 1) {
            //         res.send("created");
            //       } else {
            //         return true;
            //       }
            //     }
            //   })
            //   .catch((error) => {
            //     //console.log("hu")
            //     res.send(error);
            //   });
          }
        } else {
          res.send("No substandard found");
        }
      })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  });
};

exports.singlePropertyAssignchapterByUpdatorTemp = async (req, res) => {
  const chapters = req.body.chapter_ids.map((el) => el.id);

  const assignto = req.body.user_id;
  const expirydate = req.body.expirydate;

  try {
    /* const properties = await db.property_mapping.findAll({
      where: {
        // assignto: assignto,
        // expirydate: expirydate,
        chapter_id: {
          [Op.in]: chapters,
        },
        user_id: req.userId,
        role_id: req.role_id,
      },
    }); */

    await helper.addPropertyNotificationTemp(req,req.body.chapter_ids,assignto,"Chapters");

    db.property_mapping
      .update(
        {
          assignto: assignto,
          expirydate: expirydate,
        },
        {
          where: {
            chapter_id: {
              [Op.in]: chapters,
            },
            user_id: req.userId,
            role_id: req.role_id,
            organization_id: req.organization_id,
          },
        }
      )
      .then(() => {
        return res.status(200).send({ msg: "success" });
      })
      .catch((error) => {
        console.log(error);
        return res.status(401).send("error");
      });
  } catch (error) {
    console.log(error);
    return res.status(401).send("Network Error");
  }

  // db.property_mapping.update({
  //   ass
  // })
};

exports.singlePropertyAssignlibrary = async (req, res) => {
  // console.log(req.body.library_ids)
  try {
    req.body.library_ids.forEach((library_id, key) => {
      db.sequelize
        .query(
          `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE libraries.id=${library_id}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((finaldata) => {
          // console.log(finaldata);
          if (finaldata.length > 0) {
            for (let index = 0; index < finaldata.length; index++) {
              const elementInsert = finaldata[index];
              db.property_mapping
                .create({
                  organization_id: req.headers["organization"],
                  library_id: elementInsert.library_id,
                  chapter_id: elementInsert.chapter_id,
                  standard_id: elementInsert.standard_id,
                  substandard_id: elementInsert.id,
                  client_id: req.body.client_id,
                  user_id: req.body.user_id,
                  status: master.status.active,
                  role_id: 4,
                })
                .then((data) => {
                  if (finaldata.length == index + 1) {
                    if (req.body.library_ids.length == key + 1) {
                      res.send("created");
                    } else {
                      return true;
                    }
                  }
                })
                .catch((error) => {
                  //console.log("hu")
                  res.send(error);
                });
            }
          } else {
            return true;
          }
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};
exports.update = async (req, res) => {
  try {
    db.property_mapping
      .update(
        {
          library_id: req.body.library_id,
          chapter_id: req.body.chapter_id,
          standard_id: req.body.standard_id,
          substandard_id: req.body.substandard_id,
          client_id: req.body.client_id,
          updator_id: req.body.updator_id,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "property_mapping",
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

exports.checkProperty = async (req, res) => {
  let where = {
    status: { [Op.eq]: null },
    organization_id: req.headers["organization"],
  };
  if (req.body.library_id) {
    where["library_id"] = { [Op.in]: req.body.library_id };
  }
  if (req.body.chapter_id) {
    where["chapter_id"] = { [Op.in]: req.body.chapter_id };
  }
  if (req.body.substandard_id) {
    where["substandard_id"] = { [Op.in]: req.body.substandard_id };
  }
  if (req.body.standard_id) {
    where["standard_id"] = { [Op.in]: req.body.standard_id };
  }
  //console.log(where);
  try {
    db.property_mapping
      .findAll({
        where,
        include: [
          {
            model: db.users,
            as: "users",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
            //   attributes: [],
            //   nested: false,
            //  required: true,
            include: [
              {
                model: db.roles,
                as: "roles",
                //  attributes: [],
              },
            ],
          },
          { model: db.libraries, as: "library" },
          { model: db.chapters, as: "chapter" },
          { model: db.standards, as: "standard" },
          { model: db.sub_standards, as: "substandard" },
        ],

        // raw: true
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

exports.get = async (req, res) => {
  try {
    db.property_mapping
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
    db.property_mapping
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
  //db.property_mapping.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.property_mapping
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
          table_name: "property_mapping",
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
    db.property_mapping
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
          table_name: "property_mapping",
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

exports.UpdatorCreate = async (req, res) => {
  try {
    req.body.substandard_ids.forEach((sub_id, key) => {
      db.sequelize
        .query(
          `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id=${sub_id}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((finaldata) => {
          //console.log(finaldata);
          db.property_mapping
            .create({
              organization_id: req.headers["organization"],
              library_id: finaldata[0].library_id,
              chapter_id: finaldata[0].chapter_id,
              standard_id: finaldata[0].standard_id,
              substandard_id: finaldata[0].id,
              client_id: req.body.client_id,
              deadline: req.body.deadline,
              user_id: req.body.user_id,
              status: master.status.active,
              role_id: req.body.role_id,
              role_id: req.body.role_id,
            })
            .then((data) => {
              if (req.body.substandard_ids.length == key + 1) {
                res.send("created");
              }
            });
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.updatorSinglePropertyAssignstandard = async (req, res) => {
  var substandardIds = await db.sub_standards
    .findAll({
      attributes: ["id"],
      where: {
        standard_id: req.body.standard_ids,
        status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.id);
    });

  substandardIds.forEach((sub_id, key) => {
    db.sequelize
      .query(
        `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id=${sub_id}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then((finaldata) => {
        //console.log(finaldata);
        db.property_mapping
          .create({
            organization_id: req.headers["organization"],
            library_id: finaldata[0].library_id,
            chapter_id: finaldata[0].chapter_id,
            standard_id: finaldata[0].standard_id,
            substandard_id: finaldata[0].id,
            client_id: req.body.client_id,
            deadline: req.body.deadline,
            user_id: req.body.user_id,
            status: master.status.active,
            role_id: req.body.role_id,
            role_id: req.body.role_id,
          })
          .then((data) => {
            if (substandardIds.length == key + 1) {
              res.send("created");
            }
          });
      })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  });
};
exports.updatorSinglePropertyAssignchapter = async (req, res) => {
  //console.log(111111111111,req.headers['organization'],req.body.chapter_ids)
  try {
    req.body.chapter_ids.forEach((chapter_id, key) => {
      db.sequelize
        .query(
          `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE chapters.id=${chapter_id}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((finaldata) => {
          if (finaldata.length > 0) {
            for (let index = 0; index < finaldata.length; index++) {
              const elementInsert = finaldata[index];
              db.property_mapping
                .create({
                  organization_id: req.headers["organization"],
                  library_id: elementInsert.library_id,
                  chapter_id: elementInsert.chapter_id,
                  standard_id: elementInsert.standard_id,
                  substandard_id: elementInsert.id,
                  client_id: req.body.client_id,
                  deadline: req.body.deadline,
                  user_id: req.body.user_id,
                  status: master.status.active,
                  role_id: req.body.role_id,
                })
                .then((data) => {
                  if (finaldata.length == index + 1) {
                    if (req.body.chapter_ids.length == key + 1) {
                      res.send("created");
                    } else {
                      return true;
                    }
                  }
                })
                .catch((error) => {
                  //console.log("hu")
                  res.send(error);
                });
            }
          }
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.UpdatorCheckProperty = async (req, res) => {
  // console.log(req.body);
  let where = {
    status: { [Op.notIn]: [master.status.delete] },
    organization_id: req.headers["organization"],
  };
  if (req.body.library_id) {
    where["library_id"] = { [Op.in]: req.body.library_id };
  }
  if (req.body.chapter_id) {
    where["chapter_id"] = req.body.chapter_id;
  }
  if (req.body.substandard_id) {
    where["substandard_id"] = req.body.substandard_id;
  }
  if (req.body.standard_id) {
    where["standard_id"] = req.body.standard_id;
  }
  //console.log(where);
  try {
    db.property_mapping
      .findAll({
        where,
        // attributes: ['*',['id','property_mapping_id'],'users.name','users.id','users.roles.role_name',['library.name','library_name'],['chapter.name','chapter.name'],['chapter.name','chapter.name'],['standard.name','standard_name'],['substandard.name','substandard_name']],

        include: [
          {
            model: db.users,
            as: "users",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
            //   attributes: [],
            //   nested: false,
            //  required: true,
            include: [
              {
                model: db.roles,
                as: "roles",
                //  attributes: [],
              },
            ],
          },
          { model: db.libraries, as: "library" },
          { model: db.chapters, as: "chapter" },
          { model: db.standards, as: "standard" },
          { model: db.sub_standards, as: "substandard" },
        ],

        // raw: true
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
