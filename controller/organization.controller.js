const express = require("express");
const db = require("../models");
const master = require("../config/default.json");
const Sequelize = require("sequelize");
const bcrypt = require("bcrypt");
const { sequelize } = require("../models");
const Op = Sequelize.Op;
const Database = require("../database/server");
const logger = require("../lib/logger");
const User = require("../lib/User");
const auditCreate = require("./audits.controller");
var generator = require("generate-password");
const { exists } = require("fs");
var nodemailer = require("nodemailer");
const { dateFormatUSA } = require("../util/helper");
const helper = require("../util/helper");

exports.create = async (req, res) => {
  //console.log(req.body.package == '',req.body.package == null);
  let response = "";
  if (req.body.company_type == 1) {
    response = {
      message: "Corporate company created successfully",
    };
  }
  if (req.body.company_type == 2) {
    response = {
      message: "Sub Branch created successfully",
    };
  }
  if (req.body.company_type == 3) {
    response = {
      message: "Individual created successfully",
    };
  }

  let password = generator.generate({
    length: 20,
    numbers: true,
    uppercase: true,
    lowercase: true,
    strict: true,
    symbols: true,
    exclude: `<>&"':#$`,
  });

  const orgaNization = await db.organizations.create({
    name: req.body.name,
    company_type: req.body.company_type,
    organization_type: req.body.organization_type,
    parent_id:
      req.body.parent_id == "" || req.body.parent_id == null
        ? null
        : req.body.parent_id,
    email: req.body.email == "" ? null : req.body.email,
    country: req.body.country,
    state: req.body.state,
    city: req.body.city,
    address: req.body.address,
    zipcode: req.body.zipcode,
    mobile_no: req.body.mobile_no,
    contact_person: req.body.contact_person,
    package: req.body.package == "" ? null : req.body.package,
    no_client_admin:
      req.body.no_client_admin == "" ? null : req.body.no_client_admin,
    no_viewer: req.body.no_viewer == "" ? null : req.body.no_viewer,
    no_surveyor: req.body.no_surveyor == "" ? null : req.body.no_surveyor,
    no_updator: req.body.no_updator == "" ? null : req.body.no_updator,
    package_start:
      req.body.valid_from == "" ? null : dateFormatUSA(req.body.valid_from),
    valid_from: req.body.valid_from == "" ? null : req.body.valid_from,
    valid_to: req.body.valid_to == "" ? null : req.body.valid_to,
    status: master.status.active,
    // library: req.body.library,
  });

  //console.log(orgaNization);

  if (orgaNization) {
    if (!req.body.parent_id) {
      if (req.body.library) {
        req.body.library.forEach((element) => {
          // console.log(element)
          db.organization_libraries
            .create({
              organization_id: orgaNization.id,
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

      db.users
        .create({
          email: req.body.email,
          name: req.body.contact_person,
          role_id: master.role.superclientadmin,
          organization_id: orgaNization.id,
          mobile_number: req.body.mobile_no,
          status: master.status.active,
          password: password,
          temporary_password: password,
        })
        .then(async (data) => {
          let messageTmp = await db.msgtemplate
            .findOne({
              where: {
                msgtype: "Usercreation",
              },
            })
            .catch((error) => {
              console.log(error);
            });

          let message = messageTmp.dataValues.message;
          message = message.replace("<password>", password);

          await db.notifications.create({
            message: message,
            user_id: data.id,
            createdBy: req.userId,
          });

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

          auditCreate.create({
            user_id: req.userId,
            table_name: "users",
            primary_id: data.id,
            event: "create",
            new_value: data.dataValues,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          });
          res.send(response);
        })
        .catch((error) => {
          console.log(error);
          db.organizations
            .destroy({
              where: {
                id: orgaNization.id,
              },
            })
            .then((data) => res.send(error));
        });
    } else {
      res.send(response);
    }
  } else {
    res.send(response);
  }

  /*
  await db.organizations
    .create({
      name: req.body.name,
      company_type: req.body.company_type,
      organization_type: req.body.organization_type,
      parent_id:
        req.body.parent_id == "" || req.body.parent_id == null
          ? null
          : req.body.parent_id,
      email: req.body.email == "" ? null : req.body.email,
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      address: req.body.address,
      zipcode: req.body.zipcode,
      mobile_no: req.body.mobile_no,
      contact_person: req.body.contact_person,
      package: req.body.package == "" ? null : req.body.package,
      no_client_admin:
        req.body.no_client_admin == "" ? null : req.body.no_client_admin,
      no_viewer: req.body.no_viewer == "" ? null : req.body.no_viewer,
      no_surveyor: req.body.no_surveyor == "" ? null : req.body.no_surveyor,
      no_updator: req.body.no_updator == "" ? null : req.body.no_updator,
      valid_from: req.body.valid_from == "" ? null : req.body.valid_from,
      valid_to: req.body.valid_to == "" ? null : req.body.valid_to,
      status: master.status.active,
      // library: req.body.library,
    })
    .then(async (data) => {
      auditCreate.create({
        user_id: req.userId,
        table_name: "organizations",
        primary_id: data.id,
        event: "create",
        new_value: data.dataValues,
        url: req.url,
        user_agent: req.headers["user-agent"],
        ip_address: req.connection.remoteAddress,
      });

      if (data) {
        if (!req.body.parent_id) {
          if (req.body.library) {
            req.body.library.forEach((element) => {
              // console.log(element)
              db.organization_libraries
                .create({
                  organization_id: data.id,
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

          db.users
            .create({
              email: req.body.email,
              name: req.body.contact_person,
              role_id: master.role.superclientadmin,
              organization_id: data.id,
              mobile_number: req.body.mobile_no,
              status: master.status.active,
              password: password,
              temporary_password: password,
            })
            .then(async (data) => {
              let messageTmp = await db.msgtemplate.findOne({
                where: {
                  msgtype: "Usercreation",
                },
              });

              let message = messageTmp.dataValues.message;
              message = message.replace("<password>", password);

              await db.notifications.create({
                message: message,
                user_id: data.id,
                createdBy: req.userId,
              });

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

              auditCreate.create({
                user_id: req.userId,
                table_name: "users",
                primary_id: data.id,
                event: "create",
                new_value: data.dataValues,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });
              res.send(response);
            })
            .catch((error) => {
              // console.log(error);
              db.organizations
                .destroy({
                  where: {
                    id: data.id,
                  },
                })
                .then((data) => res.send(error));
            });
        } else {
          res.send(response);
        }
      } else {
        res.send(response);
      }
    })
    .catch((error) => {
      console.log(error);
      res.send(error);
    }); */
};

exports.packageStartDateUpdate = async (req, res) => {
  db.organizations
    .findAll({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
        organization_type: {
          [Op.ne]: null,
        },
      },
      order: [["id", "DESC"]],
    })
    .then(async (data) => {
      for (const element of data) {
        let package_start = dateFormatUSA(element.valid_from);
        if (package_start) {
          await db.organizations.update(
            {
              package_start: package_start,
            },
            {
              where: {
                id: element.id,
              },
            }
          );
        }
      }
    })
    .catch((error) => {
      console.log(error);
      logger.info("/error", error);

      res.send(error);
    });
};
exports.manageUserupdate = async (req, res) => {
  if (req.body.company_type == 1) {
    response = {
      message: "Corporate company updated successfully",
    };
  }
  if (req.body.company_type == 2) {
    response = {
      message: "Sub Branch updated successfully",
    };
  }
  if (req.body.company_type == 3) {
    response = {
      message: "Individual updated successfully",
    };
  }

  var org_mapping_ids = await db.organization_libraries
    .findAll({
      attributes: ["library_id"],
      where: {
        organization_id: req.body.id,
        status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.library_id);
    });

  //console.log(org_mapping_ids,req.body.library);

  const newarray = [];
  var missing = org_mapping_ids.filter((item, i) => {
    return item !== parseInt(req.body.library[i]);
  });

  if (req.body.library && req.body.library != "") {
    var newar = req.body.library.map((item, i) => {
      // console.log("item" + item);
      if (org_mapping_ids.indexOf(parseInt(item)) == -1) {
        // console.log(item);
        newarray.push(item);
      }
    
    });
  }

  organization_libraries_arr = [];
  if (newarray.length > 0) {
    newarray.forEach((element) => {
      organization_libraries_arr.push({
        organization_id: req.body.id,
        library_id: element,
        status: master.status.active,
        archive: master.status.inactive,
      });
    });

    await db.organization.bulkCreate(organization_libraries_arr);
  }

  if (req.body.user_id) {
    let checkuser = await db.users.findAll({
      where: {
        email: req.body.email,
        id: {
          [Op.ne]: req.body.user_id,
        },
      },
    });

    if (checkuser.length == 0) {
      console.log("update");

      let emailprops = {};
      checkuser = await db.users.findAll({
        where: {
          email: req.body.email,
          id: {
            [Op.eq]: req.body.user_id,
          },
        },
      });

      if (checkuser.length == 0) {
        emailprops.email = req.body.email;

        await db.organizations.update(
          {
            ...emailprops,
          },
          {
            where: {
              id: req.body.id,
            },
          }
        );
      }

      db.users
        .update(
          {
            ...emailprops,
            name: req.body.contact_person,
            role_id: req.body.role_id,
            organization_id: req.body.id,
            parent_organization_id: req.body.parent_organization_id,
            mobile_number: req.body.mobile_no,
            status: master.status.active,
          },
          {
            where: {
              //email: req.body.email
              id: req.body.user_id,
            },
          }
        )
        .then((data) => {
          auditCreate.create({
            user_id: req.userId,
            table_name: "users",
            primary_id: data.id,
            event: "create",
            new_value: data.dataValues,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          });
          return res.send(response);
        })
        .catch((error) => {
          console.log(error);
          res.send(error);
        });
    } else {
      return res.status(401).send("User Already Exist");
    }
  } else {
    db.users
      .update(
        {
          //email: req.body.email,
          name: req.body.contact_person,
          role_id: req.body.role_id,
          organization_id: req.body.id,
          parent_organization_id: req.body.parent_organization_id,
          mobile_number: req.body.mobile_no,
          status: master.status.active,
        },
        {
          where: { email: req.body.email },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "users",
          primary_id: data.id,
          event: "create",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        return res.send(response);
      })
      .catch((error) => {
        console.log(error);
        res.send(error);
      });
  }
};

exports.update = async (req, res) => {
  if (req.body.company_type == 1) {
    response = {
      message: "Corporate company updated successfully",
    };
  }
  if (req.body.company_type == 2) {
    response = {
      message: "Sub Branch updated successfully",
    };
  }
  if (req.body.company_type == 3) {
    response = {
      message: "Individual updated successfully",
    };
  }

  let org_mapping_ids = await db.organization_libraries
    .findAll({
      attributes: ["library_id"],
      where: {
        organization_id: req.body.id,
        // status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.library_id);
    });

  //console.log(org_mapping_ids,req.body.library);

  const newarray = [];
  var missing = org_mapping_ids.filter((item, i) => {
    return item !== parseInt(req.body.library[i]);
  });


let removeLibrary = req.body.removeLibrary || [] ;
  for (const libEl of removeLibrary) {
    let checkLib = await helper.checkLibraryToBeDeleteFromOrg(req,libEl);  
    if(checkLib) {
      await db.organization_libraries.destroy({
         where : {
          organization_id : req.body.id,
          library_id : libEl
         }
      })
    }
  }
 
  
  if (req.body.library.length > 0 && req.body.library != "") {
    var newar = req.body.library.map((item, i) => {
      // console.log("item" + item);
      if (org_mapping_ids.indexOf(parseInt(item)) == -1) {
        // console.log(item);
        newarray.push(item);
      }
      
    });
  }

  // var missing = org_mapping_ids.filter((i => a => a != parseInt(req.body.library[i]) || !++i)(0));
  //console.log(missing,newarray)

 

  try {
    db.organizations
      .update(
        {
          name: req.body.name,
          company_type: req.body.company_type,
          organization_type: req.body.organization_type,
          parent_id: req.body.parent_id == "" ? null : req.body.parent_id,
          // email: req.body.email == "" ? null : req.body.email,
          country: req.body.country,
          state: req.body.state,
          city: req.body.city,
          address: req.body.address,
          zipcode: req.body.zipcode,
          mobile_no: req.body.mobile_no,
          contact_person: req.body.contact_person,
          package: req.body.package == "" ? null : req.body.package,
          no_client_admin:
            req.body.no_client_admin == "" ? null : req.body.no_client_admin,
          no_viewer: req.body.no_viewer == "" ? null : req.body.no_viewer,
          no_surveyor: req.body.no_surveyor == "" ? null : req.body.no_surveyor,
          no_updator: req.body.no_updator == "" ? null : req.body.no_updator,
          valid_from: req.body.valid_from == "" ? null : req.body.valid_from,
          valid_to: req.body.valid_to == "" ? null : req.body.valid_to,
          // library: req.body.library,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then(async (data) => {
        if (newarray.length > 0) {
          newarray.forEach((element) => {
            db.organization_libraries
              .create({
                organization_id: req.body.id,
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
        // if(missing.length > 0 ){
        //   db.organization_libraries.destroy({where:{library_id:missing,organization_id:req.body.id}})
        // }

        //notification
        if (newarray.length > 0) {
          for (const lib of newarray) {         
      
              let newLib = await db.libraries.findOne({
                where : {
                  id : lib
                }
              })
       
      
              if(newLib) {
                let caUser = await db.users.findOne({
                  where : {
                    role_id : 2,
                    organization_id : req.body.id
                  }
                })
                let messageTmp = await db.msgtemplate
                .findOne({
                  where: {
                    msgtype: "LibraryAdded",
                  },
                })
                     
                  let message = messageTmp.dataValues.message;
                  message = message.replace("<library>", newLib.name);
      
                  await db.notifications.create({
                  message: message,
                  user_id: caUser.id,
                  redirect_to : '/ss/accreditation',
                  createdBy: req.userId,
                  });
              }
          }
        }

        if (req.body.user_id) {
          db.users
            .update(
              {
                email: req.body.email,
                name: req.body.contact_person,
                role_id: req.body.role_id,
                organization_id: req.body.id,
                parent_organization_id: req.body.parent_organization_id,
                mobile_number: req.body.mobile_no,
                status: master.status.active,
              },
              {
                where: {
                  //email: req.body.email
                  id: req.body.user_id,
                },
              }
            )
            .then((data) => {
              auditCreate.create({
                user_id: req.userId,
                table_name: "users",
                primary_id: data.id,
                event: "create",
                new_value: data.dataValues,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });
              //res.send(data);
            })
            .catch((error) => {
              console.log(error);
              // res.send(error);
            });
        } else {
          db.users
            .update(
              {
                //email: req.body.email,
                name: req.body.contact_person,
                role_id: req.body.role_id,
                organization_id: req.body.id,
                parent_organization_id: req.body.parent_organization_id,
                mobile_number: req.body.mobile_no,
                status: master.status.active,
              },
              {
                where: { email: req.body.email },
              }
            )
            .then((data) => {
              auditCreate.create({
                user_id: req.userId,
                table_name: "users",
                primary_id: data.id,
                event: "create",
                new_value: data.dataValues,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });
              //res.send(data);
            })
            .catch((error) => {
              console.log(error);
              // res.send(error);
            });
        }

        auditCreate.create({
          user_id: req.userId,
          table_name: "organizations",
          primary_id: req.body.id,
          event: "update",
          new_value: req.body,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send(response);
      })
      .catch((error) => {
        console.log(error);
        return res.send(error);
      });
  } catch (error) {
    res.send(error);
  }
};

exports.organizationuserupdate = async (req, res) => {
  //console.log(req.body)
  var password = generator.generate({
    length: 20,
    numbers: true,
    uppercase: true,
    lowercase: true,
    strict: true,
    symbols: true,
    exclude: `<>&"':#$`,
  });

  var usersexist = await db.users.findAll({
    where: {
      organization_id: req.body.id,
      role_id: "3",
      status: { [Op.notIn]: [master.status.delete] },
    },
    raw: true,
  });

  console.log(usersexist);
  if (usersexist && usersexist.length > 0) {
    response = {
      message: "Client Admin already exist for this Organization",
    };
    res.send(response);
  } else {
    try {
      db.users
        .create({
          email: req.body.email,
          name: req.body.name,
          role_id: req.body.role_id,
          organization_id: req.body.id,
          parent_organization_id: req.body.parent_organization_id,
          mobile_number: req.body.mobile_no,
          status: master.status.active,
          password: password,
          temporary_password: password,
        })
        .then(async (data) => {
          if (
            req.body.library &&
            req.body.library != "" &&
            req.body.library.length > 0
          ) {
            req.body.library.forEach((element) => {
              db.organization_libraries
                .create({
                  organization_id: req.body.id,
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
          await auditCreate.create({
            user_id: req.userId,
            table_name: "users",
            primary_id: data.id,
            event: "create",
            new_value: data.dataValues,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          });

          messageTmp = await db.msgtemplate.findOne({
            where: {
              msgtype: "Usercreation",
            },
          });

          let message = messageTmp.dataValues.message;
          message = message.replace("<password>", password);

          await db.notifications
            .create({
              message: message,
              user_id: data.id,
              createdBy: req.userId,
            })
            .then(async (result) => {
              var username = master.mailsmtp.username;
              var password = master.mailsmtp.password;
              var frommail = master.mailsmtp.frommail;

              var transporter = await nodemailer.createTransport({
                host: master.mailsmtp.host,
                port: master.mailsmtp.port,
                secure: master.mailsmtp.secure,
                // requireTLS: true,
                auth: {
                  user: username,
                  pass: password,
                },
                tls: {
                  rejectUnauthorized: false,
                },
              });

              var sendMessage = {
                from: `${username} <${frommail}>`,
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
              response = {
                message: "User Created Successfully",
              };
              await transporter.sendMail(sendMessage, (error, info) => {
                if (error) {
                  console.log(error);

                  return res.send(response);
                }

                return res.send(response);
              });

              return res.send(response);
            })
            .catch((error) => {
              console.log(error);
              res.send(error);
            });
        })
        .catch((error) => {
          console.log(error);
          response = {
            message: "Client Admin already exist for this Organization",
          };
          res.send(response);
        });
    } catch (error) {
      logger.info("/error", error);

      res.send(error);
    }
  }
  /*
  try {
    db.organizations
      .update(
        {
          user_added: 1,
          email: req.body.email, // for sub company dont need to update
          mobile_no: req.body.mobile_no == "" ? null : req.body.mobile_no,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        if (req.body.library) {
          req.body.library.forEach((element) => {
            // console.log(element)
            db.organization_libraries
              .create({
                organization_id: req.body.id,
                library_id: element,
                status: master.status.active,
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
        db.users
          .create({
            email: req.body.email,
            name: req.body.name,
            role_id: req.body.role_id,
            organization_id: req.body.id,
            parent_organization_id: req.body.parent_organization_id,
            mobile_number: req.body.mobile_no,
            status: master.status.active,
            password: password,
            temporary_password: password,
          })
          .then(async (data) => {
            await auditCreate.create({
              user_id: req.userId,
              table_name: "users",
              primary_id: data.id,
              event: "create",
              new_value: data.dataValues,
              url: req.url,
              user_agent: req.headers["user-agent"],
              ip_address: req.connection.remoteAddress,
            });

            messageTmp = await db.msgtemplate.findOne({
              where: {
                msgtype: "Usercreation",
              },
            });

            let message = messageTmp.dataValues.message;
            message = message.replace("<password>", password);

            await db.notifications
              .create({
                message: message,
                user_id: data.id,
                createdBy: req.userId,
              })
              .then(async (result) => {
                var username = master.mailsmtp.username;
                var password = master.mailsmtp.password;
                var frommail = master.mailsmtp.frommail;

                var transporter = await nodemailer.createTransport({
                  host: master.mailsmtp.host,
                  port: master.mailsmtp.port,
                  secure: master.mailsmtp.secure,
                  // requireTLS: true,
                  auth: {
                    user: username,
                    pass: password,
                  },
                  tls: {
                    rejectUnauthorized: false,
                  },
                });

                var sendMessage = {
                  from: `${username} <${frommail}>`,
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
                    return res.send(data);
                  }
                  return res.send(data);
                });

                return res.send(data);
              })
              .catch((error) => {
                console.log(error);
                res.send(data);
              });
          })
          .catch((error) => {
            console.log(error);
            // db.organizations.destroy({
            //   where: {
            //     id: data.id
            //   }
            // }).then(data => res.send(error))
            res.send(error);
          })
          .catch((error) => {
            res.send(error);
          });
        auditCreate.create({
          user_id: req.userId,
          table_name: "organizations",
          primary_id: req.body.id,
          event: "update",
          new_value: req.body,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
      })
      .catch((error) => {
        logger.info("/error", error);

        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);

    res.send(error);
  }*/
};

userFind = async (id) => {
  // console.log(id)
  var user = await db.users.findOne({
    where: {
      organization_id: id,
      status: {
        [Op.notIn]: [master.status.delete],
        // attributes: ['name','role_id','email','mobile_number',['id','user_id'],'roles.id','roles.role_name'],
      },
    },

    include: [
      {
        model: db.roles,
        as: "roles",
        //   attributes: [],
        //   nested: false,
        //  required: true,
      },
    ],
    // ,raw:true
  });

  var libraries = await db.organization_libraries.findAll({
    where: {
      organization_id: id,
      status: {
        [Op.notIn]: [master.status.delete],
        // attributes: ['name','role_id','email','mobile_number',['id','user_id'],'roles.id','roles.role_name'],
      },
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
  });

  if (user && user.dataValues) {
    user.dataValues.libraryData = libraries;
  }

  // console.log(user);
  return user;
};
exports.get = async (req, res) => {
  db.organizations
    .findAll({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
      include: [
        { model: db.subscription_packages, as: "subscriptionPackage" },
        { model: db.organization_type, as: "organizationtype" },
      ],
    })
    .then(async (data) => {
      if (data.length > 0) {
        // data.forEach((element, key) => {
        for (let key = 0; key < data.length; key++) {
          const element = data[key];

          // }
          var userGet = await userFind(element.id);
          //console.log(userGet)
          db.organization_libraries
            .findAll({
              where: {
                organization_id: element.id,
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
            })
            .then((librarydata) => {
              // console.log(librarydata);
              data[key].dataValues.librarydetails = librarydata;
              data[key].dataValues.userGet = userGet;

              // element.dataValues.test=librarydata;
              if (data.length == key + 1) {
                res.send(data);
              }
            })
            .catch((error) => {
              logger.info("/error", error);
              res.send(error);
            });
        }
        // });
      } else {
        res.send(data);
      }
    })
    .catch((error) => {
      logger.info("/error", error);
      res.send(error);
    });
};

exports.getbyOrgType = async (req, res) => {
  db.organizations
    .findAll({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
        organization_type: req.params.id,
      },
    })
    .then(async (data) => {
      res.send(data);
    })
    .catch((error) => {
      logger.info("/error", error);
      res.send(error);
    });
};

exports.getAllOrgs = async (req, res) => {
  if (req.role_id) {
    if (req.role_id === 2) {
      db.organizations
        .findAll({
          where: {
            status: { [Op.notIn]: [master.status.delete] },
            [Op.or]: [
              { parent_id: req.organization_id },
              { id: req.organization_id },
            ],
          },
        })
        .then(async (data) => {
          console.log(data.length);
          res.send(data);
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    } else {
      db.organizations
        .findAll({
          where: {
            status: { [Op.notIn]: [master.status.delete] },
          },
        })
        .then(async (data) => {
          res.send(data);
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    }
  }
};

exports.Reportget = async (req, res) => {
  db.organizations
    .findAll({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
        parent_id: { [Op.eq]: null },
      },
      order: [["id", "DESC"]],
      include: [
        { model: db.organizations, as: "children" },
        { model: db.subscription_packages, as: "subscriptionPackage" },
        { model: db.organization_type, as: "organizationtype" },
      ],
    })
    .then(async (data) => {
      if (data.length > 0) {
        // data.forEach((element, key) => {
        for (let key = 0; key < data.length; key++) {
          const element = data[key];

          // }
          var userGet = await userFind(element.id);
          //console.log(userGet)
          db.organization_libraries
            .findAll({
              where: {
                organization_id: element.id,
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
              group: ["libraries.id"],
            })
            .then((librarydata) => {
              // console.log(librarydata);
              data[key].dataValues.librarydetails = librarydata;
              data[key].dataValues.userGet = userGet;

              // element.dataValues.test=librarydata;
              if (data.length == key + 1) {
                res.send(data);
              }
            })
            .catch((error) => {
              logger.info("/error", error);
              res.send(error);
            });
        }
        // });
      } else {
        res.send(data);
      }
    })
    .catch((error) => {
      logger.info("/error", error);
      res.send(error);
    });
};

exports.masterorganization = async (req, res) => {
  db.organizations
    .findAll({
      attributes: ["id", "name"],
      where: {
        status: { [Op.notIn]: [master.status.delete] },
        parent_id: 0,
      },
    })
    .then((data) => res.send(data))
    .catch((error) => {
      logger.info("/error", error);
      res.send(error);
    });
};

exports.getById = async (req, res) => {
  //   var sql1 =`SELECT libraries.* FROM libraries INNER JOIN company_libraries ON libraries.id=company_libraries.library_id WHERE company_libraries.organization_id = 15 GROUP BY libraries.id`

  //   Database.getDb().query(sql1, function(error, result) {
  //   var result_data = {'status':'success',data:result};
  //   res.status(200).json(result_data);
  // })

  // var sql1 = `SELECT libraries.* FROM libraries INNER JOIN company_libraries ON libraries.id=company_libraries.library_id WHERE company_libraries.organization_id = 15 GROUP BY libraries.id`
  var user = await db.users.findOne({
    where: {
      organization_id: req.params.id,
      status: { [Op.notIn]: [master.status.delete] },
      role_id: [master.role.clientadmin, master.role.superclientadmin],
    },
  });
  db.organizations
    .findOne({
      include: [
        {
          model: db.subscription_packages,
          as: "subscriptionPackage",
        },
      ],
      where: {
        id: req.params.id,
      },
    })
    .then((organizationData) => {
      db.organization_libraries
        .findAll({
          where: {
            organization_id: req.params.id,
          },
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
          group: ["libraries.id"], //in superadmin manage company edit case duplicate library displaying
        })
        .then((librarydata) => {
          // console.log(librarydata)
          organizationData.dataValues.libraryData = librarydata;
          organizationData.dataValues.user = user;
          //console.log(librarydata);
          res.send(organizationData);
        })
        .catch((error) => {
          logger.info("/1error", error);
          res.send(error);
        });

      // res.send(organizationData)
    })
    .catch((error) => {
      logger.info("/error", error);
      res.send(error);
    });
};

exports.getByMasterCompanyIdWithSub = async (req, res) => {
  db.organizations
    .findAll({
      include: [{ model: db.subscription_packages, as: "subscriptionPackage" }],
      where: {
        // parent_id: req.params.id
        [Op.or]: [{ parent_id: req.params.id }, { id: req.params.id }],
        status: { [Op.notIn]: [master.status.delete] },
      },
      // where: {
      //   status: {[Op.notIn]:[ master.status.delete ]}
      // }
    })
    .then(async (data) => {
      if (data.length > 0) {
        // data.forEach((element, key) => {
        for (let key = 0; key < data.length; key++) {
          const element = data[key];

          // }
          var userGet = await userFind(element.id);
          let companyId =
            element.parent_id && element.parent_id != 0
              ? element.parent_id
              : element.id;
          db.organization_libraries
            .findAll({
              where: {
                //organization_id: element.id,
                organization_id: companyId,
                status: { [Op.notIn]: [master.status.delete] },
              },
              group: ["library_id"],
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
            })
            .then((librarydata) => {
              // console.log(librarydata);
              data[key].dataValues.librarydetails = librarydata;
              data[key].dataValues.userGet = userGet;

              // element.dataValues.test=librarydata;
              if (data.length == key + 1) {
                res.send(data);
              }
            })
            .catch((error) => {
              logger.info("/error", error);
              res.send(error);
            });
        }
        // });
      } else {
        res.send(data);
      }
    });
};

exports.getByMasterCompanyId = async (req, res) => {
  db.organizations
    .findAll({
      include: [{ model: db.subscription_packages, as: "subscriptionPackage" }],
      where: {
        parent_id: req.params.id,
        // [Op.or]: [{ parent_id: req.params.id }, { id: req.params.id }],
        status: { [Op.notIn]: [master.status.delete] },
      },
      // where: {
      //   status: {[Op.notIn]:[ master.status.delete ]}
      // }
    })
    .then(async (data) => {
      if (data.length > 0) {
        // data.forEach((element, key) => {
        for (let key = 0; key < data.length; key++) {
          const element = data[key];

          // }
          var userGet = await userFind(element.id);
          // console.log(userGet);
          db.organization_libraries
            .findAll({
              where: {
                //organization_id: element.id,
                organization_id: element.parent_id,
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
            })
            .then((librarydata) => {
              // console.log(librarydata);
              data[key].dataValues.librarydetails = librarydata;
              data[key].dataValues.userGet = userGet;

              // element.dataValues.test=librarydata;
              if (data.length == key + 1) {
                res.send(data);
              }
            })
            .catch((error) => {
              logger.info("/error", error);
              res.send(error);
            });
        }
        // });
      } else {
        res.send(data);
      }
    });
};
exports.delete = async (req, res) => {
  //db.organizations.destroy({
  //      where:{
  //   id:req.params.id
  // }
  var orginactive = await db.organizations.findOne({
    where: {
      status: master.status.inactive,
      id: req.params.id,
    },
  });

  if (orginactive) {
    db.organizations
      .update(
        {
          status: master.status.delete,
        },
        {
          where: { id: req.params.id },
        }
      )
      .then(async (data) => {
        await db.organizations.update(
          {
            status: req.params.delete,
          },
          {
            where: {
              [Op.or]: [
                {
                  id: req.params.id,
                },
                {
                  parent_id: req.params.id,
                },
              ],
            },
          }
        );
        await db.users.update(
          {
            status: req.params.delete,
          },
          {
            where: {
              [Op.or]: [
                {
                  organization_id: req.params.id,
                },
                {
                  parent_organization_id: req.params.id,
                },
              ],
            },
          }
        );

        auditCreate.create({
          user_id: req.userId,
          table_name: "organizations",
          primary_id: req.params.id,
          event: "delete",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("updated");
      });
  } else {
    db.organizations
      .update(
        {
          status: master.status.inactive,
        },
        {
          where: { id: req.params.id },
        }
      )
      .then(async (data) => {
        await db.users.update(
          { status: master.status.inactive },
          {
            where: {
              organization_id: req.params.id,
            },
          }
        );

        auditCreate.create({
          user_id: req.userId,
          table_name: "organizations",
          primary_id: req.params.id,
          event: "inactive",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("updated");
      });
  }
};

exports.deactivate = async (req, res) => {
  //db.organizations.destroy({
  //      where:{
  //   id:req.params.id
  // }
  db.organizations
    .update(
      {
        status: master.status.inactive,
      },
      {
        where: { id: req.params.id },
      }
    )
    .then((data) => {
      auditCreate.create({
        user_id: req.userId,
        table_name: "organizations",
        primary_id: req.params.id,
        event: "deactivate",
        new_value: data.dataValues,
        url: req.url,
        user_agent: req.headers["user-agent"],
        ip_address: req.connection.remoteAddress,
      });
      res.send("updated");
    });
};
exports.statusChange = async (req, res) => {
  db.organizations
    .update(
      {
        status: req.params.status,
      },
      {
        where: { id: req.params.id },
      }
    )
    .then(async (data) => {
      await db.organizations.update(
        {
          status: req.params.status,
        },
        {
          where: {
            [Op.or]: [
              {
                id: req.params.id,
              },
              {
                parent_id: req.params.id,
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
                organization_id: req.params.id,
              },
              {
                parent_organization_id: req.params.id,
              },
            ],
          },
        }
      );

      auditCreate.create({
        user_id: req.userId,
        table_name: "organizations",
        primary_id: req.params.id,
        event: "status change",
        new_value: data.dataValues,
        url: req.url,
        user_agent: req.headers["user-agent"],
        ip_address: req.connection.remoteAddress,
      });
      res.send({ message: "Status Changed Successfully" });
    })
    .catch((error) => res.send({ message: "Something Went Wrong" }));
};

exports.cityGet = async (req, res) => {
  //console.log(req.query)
  db.organizations
    .findAll({
      attributes: ["state"],
      where: {
        state: {
          [Op.like]: "%" + req.query.city + "%",
        },
        // distinct:true
        // group: ['state'],
        // status: {[Op.notIn]:[ master.status.delete ]}
      },
    })
    .then((data) => res.send(data));
};
function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}
exports.getMasterWithsub = async (req, res) => {
  //console.log(req.params.id);
  orgId = req.params.id ? req.params.id : null;

  if (req.role_id == 2) {
    orgId = req.headers["organization"] ? req.headers["organization"] : null;
  }

  let where = { status: { [Op.notIn]: [master.status.delete] } };
  //console.log(orgId);

  if (orgId) {
    where = { ...where, [Op.or]: [{ id: orgId }, { parent_id: orgId }] };
  }

  //console.log(where);

  db.organizations
    .findAll({
      where,
      include: [
        { model: db.subscription_packages, as: "subscriptionPackage" },
        // {model:db.company_libraries,as:'libraryForeign'}
      ],
      order: [["id", "DESC"]],
    })
    .then(async (data) => {
      if (data.length > 0) {
        for (let key = 0; key < data.length; key++) {
          const element = data[key];
          if (element.valid_to) {
            var str = element.valid_to;
            var str1 = element.valid_from;
            var split = str.split("----").pop();
            var split1 = str1.split("----").pop();
            data[key].dataValues.valid_to_format = split;
            data[key].dataValues.valid_from_format = split1;
          }

          // data.forEach((element, key) => {
          //console.log(element.id);
          var userGet = await userFind(element.id);
          var subcount = await db.organizations.count({
            where: {
              parent_id: element.id,
              status: { [Op.notIn]: [master.status.delete] },
            },
          });
          await db.organization_libraries
            .findAll({
              where: {
                organization_id: element.id,
                status: { [Op.notIn]: [master.status.delete] },
              },
              // group: ["library_id"],
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
            })
            .then((librarydata) => {
              //console.log(librarydata);
              data[key].dataValues.librarydetails = librarydata;
              data[key].dataValues.subBranchCount = subcount;
              data[key].dataValues.userGet = userGet;

              // element.dataValues.test=librarydata;
              if (data.length == key + 1) {
                res.send(data);
              }
            })
            .catch((error) => {
              logger.info("/error", error);
              res.send(error);
            });
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

subCount = async (id) => {
  return await db.organizations.count({
    where: { parent_id: id, status: { [Op.notIn]: [master.status.delete] } },
  });
};
