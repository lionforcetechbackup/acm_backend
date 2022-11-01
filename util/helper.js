const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const auditCreate = require("../controller/audits.controller");
const crypto = require("crypto");
const server = require("../database/server");

exports.getDueDate = (submissionOf, respFreq, givenDate = new Date()) => {
  if (
    submissionOf == "" ||
    submissionOf == null ||
    respFreq == "" ||
    respFreq == null
  ) {
    return null;
  }
  submissionOf = new Date(submissionOf);
  givenDate = new Date(givenDate);
  submissionOf = submissionOf.getTime();

  switch (respFreq) {
    case "Annual":
      // while (submissionOf < givenDate.getTime()) {
      //   submissionOf = new Date(submissionOf);
      //   submissionOf = submissionOf.setFullYear(submissionOf.getFullYear() + 1);
      // }
      submissionOf = endOfAnnual(givenDate);
      return formatDate(submissionOf);
    case "Monthly":
      /*while (submissionOf < givenDate.getTime()) {
        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 1);
      }*/ // old logic
      submissionOf = endOfMonth(givenDate);
      return formatDate(submissionOf);
    case "Biannual":
      /*while (submissionOf < givenDate.getTime()) {
        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 6);
      }*/
      submissionOf = endOfBiannual(givenDate);
      return formatDate(submissionOf);
    case "Quarterly":
      let quarter = getQuarter(givenDate);

      switch (quarter) {
        case 1:
          submissionOf = new Date(givenDate.getFullYear() + "-03-31");
          break;
        case 2:
          submissionOf = new Date(givenDate.getFullYear() + "-06-30");
          break;
        case 3:
          submissionOf = new Date(givenDate.getFullYear() + "-09-30");
          break;
        case 4:
          submissionOf = new Date(givenDate.getFullYear() + "-12-31");
          break;
        default:
          submissionOf = givenDate;
          break;
      }

      // while (submissionOf < givenDate.getTime()) {

      //   submissionOf = new Date(submissionOf);
      //   submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 3);
      // }
      return formatDate(submissionOf);
    case "Weekly":
      let weekno = getWeekDayNo(givenDate);
      let lastDayOfMonth = endOfMonth(givenDate);
      switch (weekno) {
        case 1:
          submissionOf = new Date(
            givenDate.getFullYear() + "-" + (givenDate.getMonth() + 1) + "-07"
          );
          break;
        case 2:
          submissionOf = new Date(
            givenDate.getFullYear() + "-" + (givenDate.getMonth() + 1) + "-14"
          );
          break;
        case 3:
          submissionOf = new Date(
            givenDate.getFullYear() + "-" + (givenDate.getMonth() + 1) + "-21"
          );
          break;
        case 4:
          submissionOf = new Date(
            givenDate.getFullYear() +
              "-" +
              (givenDate.getMonth() + 1) +
              "-" +
              lastDayOfMonth.getDate()
          );
          break;
        case 5:
          submissionOf = new Date(
            givenDate.getFullYear() +
              "-" +
              givenDate.getMonth() +
              "-" +
              lastDayOfMonth.getDate()
          );
          break;
        default:
          submissionOf = givenDate;
          break;
      }
      // while (submissionOf < givenDate.getTime()) {
      //   submissionOf = new Date(submissionOf);
      //   submissionOf = submissionOf.setDate(submissionOf.getDate() + 7);
      // }
      return formatDate(submissionOf);
    default:
      return new formatDate(submissionOf);
  }
};

exports.mysql_real_escape_string = (str) => {
  // str = server.getDb().escape(str);
  return str;
  /* return str.replace(/[\0\x08\x09\x1a\n\r"'`\\\%]/g, function (char) {
    switch (char) {
      case "\0":
        return "\\0";
      case "\x08":
        return "\\b";
      case "\x09":
        return "\\t";
      case "\x1a":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case '"':
      case "'":
      case "`":
      case "\\":
      case "%":
        return "\\" + char; // prepends a backslash to backslash, percent,
      // and double/single quotes
    }
  });*/
};

function getQuarter(date) {
  const today = new Date(date);
  const quarter = Math.floor((today.getMonth() + 3) / 3);
  return quarter;
}

function getWeekDayNo(date) {
  const today = new Date(date);
  let dateno = today.getDate();
  return Math.ceil(dateno / 7);
}

function endOfQuarter(givenDate) {
  let quarter = getQuarter(givenDate);

  switch (quarter) {
    case 1:
      submissionOf = new Date(givenDate.getFullYear() + "-03-31");
      break;
    case 2:
      submissionOf = new Date(givenDate.getFullYear() + "-06-30");
      break;
    case 3:
      submissionOf = new Date(givenDate.getFullYear() + "-09-30");
      break;
    case 4:
      submissionOf = new Date(givenDate.getFullYear() + "-12-31");
      break;
    default:
      submissionOf = givenDate;
      break;
  }

  return formatDate(submissionOf);
}

function getBiannual(date) {
  const today = new Date(date);
  const BiAnnual = Math.floor((today.getMonth() + 6) / 6);
  return BiAnnual;
}

function endOfBiannual(givenDate) {
  let BiAnnual = getBiannual(givenDate);

  switch (BiAnnual) {
    case 1:
      submissionOf = new Date(givenDate.getFullYear() + "-06-30");
      break;
    case 2:
      submissionOf = new Date(givenDate.getFullYear() + "-12-31");
      break;
    default:
      submissionOf = givenDate;
      break;
  }

  return formatDate(submissionOf);
}

function endOfAnnual(givenDate) {
  submissionOf = new Date(givenDate.getFullYear() + "-12-31");
  return formatDate(submissionOf);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

exports.getDueDateOldEntry = (
  submissionOf,
  respFreq,
  givenDate = new Date()
) => {
  if (
    submissionOf == "" ||
    submissionOf == null ||
    respFreq == "" ||
    respFreq == null
  ) {
    return null;
  }
  submissionOf = new Date(submissionOf);
  givenDate = new Date(givenDate);
  submissionOf = submissionOf.getTime();

  switch (respFreq) {
    case "Annual":
      while (submissionOf < givenDate.getTime()) {
        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setFullYear(submissionOf.getFullYear() + 1);
      }

      if (submissionOf > givenDate.getTime()) {
        while (submissionOf >= givenDate.getTime()) {
          submissionOf = new Date(submissionOf);
          submissionOf = submissionOf.setFullYear(
            submissionOf.getFullYear() - 1
          );
        }

        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setFullYear(submissionOf.getFullYear() + 1);
      }
      return formatDate(submissionOf);
    case "Monthly":
      console.log("givenDate", givenDate);
      while (submissionOf < givenDate.getTime()) {
        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 1);
      }
      if (submissionOf > givenDate.getTime()) {
        while (submissionOf >= givenDate.getTime()) {
          submissionOf = new Date(submissionOf);
          submissionOf = submissionOf.setMonth(submissionOf.getMonth() - 1);
        }

        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 1);
      }

      return formatDate(submissionOf);
    case "Biannual":
      console.log("givenDate", givenDate);
      while (submissionOf < givenDate.getTime()) {
        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 6);
      }
      if (submissionOf > givenDate.getTime()) {
        while (submissionOf >= givenDate.getTime()) {
          submissionOf = new Date(submissionOf);
          submissionOf = submissionOf.setMonth(submissionOf.getMonth() - 6);
        }

        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 6);
      }

      return formatDate(submissionOf);
    /* while (submissionOf < givenDate.getTime()) {
        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 6);
      }

      if(submissionOf > givenDate.getTime()) {
        while (submissionOf >= givenDate.getTime()) {
          submissionOf = new Date(submissionOf);
          submissionOf = submissionOf.setMonth(submissionOf.getMonth() - 6);
        }

        submissionOf = new Date(submissionOf);
          submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 6);
      }
      return formatDate(submissionOf);*/
    case "Quarterly":
      console.log("givenDate", givenDate);
      while (submissionOf < givenDate.getTime()) {
        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 3);
      }
      if (submissionOf > givenDate.getTime()) {
        while (submissionOf >= givenDate.getTime()) {
          submissionOf = new Date(submissionOf);
          submissionOf = submissionOf.setMonth(submissionOf.getMonth() - 3);
        }

        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 3);
      }

      return formatDate(submissionOf);
    // while (submissionOf < givenDate.getTime()) {
    //   submissionOf = new Date(submissionOf);
    //   submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 3);
    // }
    // return formatDate(submissionOf);
    case "Weekly":
      while (submissionOf < givenDate.getTime()) {
        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setDate(submissionOf.getDate() + 7);
      }

      if (submissionOf > givenDate.getTime()) {
        while (submissionOf >= givenDate.getTime()) {
          submissionOf = new Date(submissionOf);
          submissionOf = submissionOf.setMonth(submissionOf.getMonth() - 3);
        }

        submissionOf = new Date(submissionOf);
        submissionOf = submissionOf.setMonth(submissionOf.getMonth() + 3);
      }
      return formatDate(submissionOf);
    default:
      return new formatDate(submissionOf);
  }
};

exports.dateFormatUSA = (date) => {
  let d = new Date(date);
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  let year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
};

exports.dateFormatIndia = (date) => {
  let d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [day, month, year].join("-");
};

function formatDate(date) {
  let d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

exports.getStartAndEndDate = async (
  givenStartDate,
  givenEndDate,
  responseType,
  submissionOf
) => {
  //  console.log(givenStartDate, givenEndDate);
  if (responseType == "Weekly") {
    let startDate = new Date(givenStartDate);

    let [month, day, year] = [
      startDate.getMonth() + 1,
      startDate.getDate(),
      startDate.getFullYear(),
    ];
    if (day <= 7) {
      startDate = year + "-" + month + "-" + 01;
    } else if (day <= 14) {
      startDate = year + "-" + month + "-" + 08;
    } else if (day <= 21) {
      startDate = year + "-" + month + "-" + 15;
    } else {
      startDate = year + "-" + month + "-" + 22;
    }

    let endDate = new Date(givenEndDate);
    [month, day, year] = [
      endDate.getMonth() + 1,
      endDate.getDate(),
      endDate.getFullYear(),
    ];
    if (day <= 7) {
      endDate = year + "-" + month + "-" + 07;
    } else if (day <= 14) {
      endDate = year + "-" + month + "-" + 14;
    } else if (day <= 21) {
      endDate = year + "-" + month + "-" + 21;
    } else {
      let lastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

      console.log("lastDay", lastDay);
      [lastDayMonth, lastDayDate, lastDayYear] = [
        lastDay.getMonth(),
        lastDay.getDate(),
        lastDay.getFullYear(),
      ];
      endDate = year + "-" + month + "-" + lastDayDate;
    }
    startDate = formatDate(startDate);
    endDate = formatDate(endDate);
    console.log({ startDate, endDate });
    return { startDate, endDate };
  } else if (responseType == "Monthly") {
    // let startDate = exports.getDueDate(
    //   submissionOf,
    //   responseType,
    //   givenStartDate
    // );

    let startDate = formatDate(startOfMonth(new Date(givenStartDate)));

    let endDate = exports.getDueDate(submissionOf, responseType, givenEndDate);

    /* while (
      new Date(startDate).getTime() >= new Date(givenStartDate).getTime()
    ) {
      let date = new Date(startDate);
      date = date.setMonth(date.getMonth() - 1);
      startDate = formatDate(date);
    }

    let date = new Date(startDate);
    date = date.setDate(date.getDate() + 1);
    startDate = formatDate(date);
*/
    return { startDate, endDate };
  } else if (responseType == "Quarterly") {
 
    let startDate = exports.getDueDate(
      submissionOf,
      responseType,
      givenStartDate
    );
 

    //date is displaying prev month during filter
    

    let date = new Date(startDate);
    date = date.setMonth(date.getMonth() - 3); 
    date = new Date(date);
    date = date.setDate(date.getDate() + 1); 
    startDate = formatDate(date);  
    let endDate = exports.getDueDate(submissionOf, responseType, givenEndDate); 
    return { startDate, endDate };
  } else if (responseType == "Biannual") {
    let startDate = exports.getDueDate(
      submissionOf,
      responseType,
      givenStartDate
    );

    console.log("startDate......", startDate);

    let date = new Date(startDate);
    date = date.setMonth(date.getMonth() - 6);
    date = endOfMonth(new Date(date));
    date = new Date(date);
    date = date.setDate(date.getDate() + 1);
    startDate = formatDate(date);
    console.log("startdate 2", startDate);
    let endDate = exports.getDueDate(submissionOf, responseType, givenEndDate);

    return { startDate, endDate };
  } else if (responseType == "Annual") {
    let startDate = exports.getDueDate(
      submissionOf,
      responseType,
      givenStartDate
    );

    let date = new Date(startDate);
    date = date.setMonth(date.getMonth() - 12);
    date = endOfMonth(new Date(date));
    date = new Date(date);
    date = date.setDate(date.getDate() + 1);
    startDate = formatDate(date);

    let endDate = exports.getDueDate(submissionOf, responseType, givenEndDate);

    return { startDate, endDate };
  } else {
    return { startDate: null, endDate: null };
  }
};

const getMonthnoRes = (date, responseType, submissionOf) => {
  //new Logic

  let d = new Date(submissionOf);
  date = new Date(date);

  // console.log(d);
  // console.log(date);
  j = d.getMonth();
  i = 0;

  if (d.getTime() >= new Date(date).getTime()) {
    console.log("First");
    while (d.getTime() >= new Date(date).getTime()) {
      // d.setMonth(d.getMonth() - i);
      d.setMonth(d.getMonth() - i);

      if (d.getTime() <= date.getTime()) {
        return j + 1;
      }
      if (j == 0) {
        j = 12;
      }
      j--;
      d = new Date(submissionOf);
      i++;
    }
  } else {
    console.log("Second");
    console.log(d.getTime() < new Date(date).getTime());
    while (d.getTime() <= new Date(date).getTime()) {
      d.setMonth(d.getMonth() + i);

      if (d.getTime() > date.getTime()) {
        return j;
      }
      j++;
      if (j == 11) {
        j = 0;
      }

      d = new Date(submissionOf);
      i++;
    }
  }
};

exports.getResponseHeadKPI = async (
  givenStartDate,
  givenEndDate,
  responseType,
  submissionOf
) => {
  let filter = await exports.getStartAndEndDate(
    givenStartDate,
    givenEndDate,
    responseType,
    submissionOf
  );

  console.log("filter", filter);

  let filterStartDate = filter.startDate;
  let filterEndDate = filter.endDate;

  // console.log('filterStartDate',filterStartDate);
  // console.log("filterEndDate", this.dateFormatUSA(filterEndDate));

  const month = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let response = [];
  const Week = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const getWeekNo = (dayno) => {
    if (dayno <= 7) {
      return Week[0];
    } else if (dayno <= 14) {
      return Week[1];
    } else if (dayno <= 21) {
      return Week[2];
    } else if (dayno > 21) {
      return Week[3];
    } else return null;
  };

  if (responseType == "Weekly") {
    while (
      new Date(filterStartDate).getTime() < new Date(filterEndDate).getTime()
    ) {
      let date = new Date(filterStartDate);

      if (date.getDate() > 28) {
        filterStartDate = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          "01"
        );
      } else {
        let responseEndDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 6
        );

        if (getWeekNo(date.getDate()) == "Week 4") {
          responseEndDate = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0
          );
        }
        response.push({
          week: month[date.getMonth()] + " " + getWeekNo(date.getDate()),
          responseDate: filterStartDate,
          responseEndDate: responseEndDate,
        });

        filterStartDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 7
        );
      }
    }
  } else if (responseType == "Monthly") {
    // console.log('monthly');
    console.log("filterStartDate", filterStartDate);
    console.log("filterEndDate", filterEndDate);
    let j = 1;
    let zdate = new Date(filterStartDate);
    while (
      new Date(filterStartDate).getTime() <= new Date(filterEndDate).getTime()
    ) {
      let date = new Date(filterStartDate);
      let mname = getMonthnoRes(date, responseType, submissionOf);
      if (mname == 12) {
        mname = 0;
      }
      date = new Date(date.setDate(date.getDate() - 1));

      let responseEndDate = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );

      response.push({
        week: month[mname],
        responseDate: formatDate(filterStartDate),
        responseEndDate: responseEndDate,
      });

      date = new Date(date.setDate(date.getDate() + 1));

      // filterStartDate = new Date(
      //   zdate.getFullYear(),
      //   zdate.getMonth() + j,
      //   zdate.getDate()
      // );

      let edate = new Date(responseEndDate);

      filterStartDate = new Date(
        edate.getFullYear(),
        edate.getMonth(),
        edate.getDate() + 1
      );

      j++;
    }
  } else if (responseType == "Quarterly") {
    let j = 1;
    let zdate = new Date(filterStartDate);
    while (
      new Date(filterStartDate).getTime() <= new Date(filterEndDate).getTime()
    ) {
      let date = new Date(filterStartDate);
      let mname = date.getMonth();
      date = new Date(date.setDate(date.getDate() - 1));
      let responseEndDate = new Date(
        date.getFullYear(),
        date.getMonth() + 3,
        date.getDate()
      );
      response.push({
        week: month[mname],
        responseDate: formatDate(filterStartDate),
        responseEndDate: responseEndDate,
      });
      date = new Date(date.setDate(date.getDate() + 1));
      // filterStartDate = new Date(
      //   date.getFullYear(),
      //   date.getMonth() + 3,
      //   date.getDate()
      // );

      let edate = new Date(responseEndDate);

      filterStartDate = new Date(
        edate.getFullYear(),
        edate.getMonth(),
        edate.getDate() + 1
      );
    }
  } else if (responseType == "Biannual") {
    while (
      new Date(filterStartDate).getTime() < new Date(filterEndDate).getTime()
    ) {
      let date = new Date(filterStartDate);
      let mname = date.getMonth();
      date = new Date(date.setDate(date.getDate() - 1));
      let responseEndDate = new Date(
        date.getFullYear(),
        date.getMonth() + 6,
        date.getDate()
      );
      response.push({
        week: month[mname],
        responseDate: formatDate(filterStartDate),
        responseEndDate: responseEndDate,
      });
      date = new Date(date.setDate(date.getDate() + 1));

      let edate = new Date(responseEndDate);

      filterStartDate = new Date(
        edate.getFullYear(),
        edate.getMonth(),
        edate.getDate() + 1
      );
    }
  } else if (responseType == "Annual") {
    while (
      new Date(filterStartDate).getTime() < new Date(filterEndDate).getTime()
    ) {
      let date = new Date(filterStartDate);
      let mname = date.getMonth();
      date = new Date(date.setDate(date.getDate() - 1));
      let responseEndDate = new Date(
        date.getFullYear(),
        date.getMonth() + 12,
        date.getDate()
      );
      response.push({
        week: month[mname],
        responseDate: formatDate(filterStartDate),
        responseEndDate: responseEndDate,
      });
      date = new Date(date.setDate(date.getDate() + 1));
      // filterStartDate = new Date(
      //   date.getFullYear(),
      //   date.getMonth() + 12,
      //   date.getDate()
      // );

      let edate = new Date(responseEndDate);

      filterStartDate = new Date(
        edate.getFullYear(),
        edate.getMonth(),
        edate.getDate() + 1
      );
    }
  }

  return response;
};

exports.getResponseHead = async (
  givenStartDate,
  givenEndDate,
  responseType,
  submissionOf
) => {

  
  let filter = await exports.getStartAndEndDate(
    givenStartDate,
    givenEndDate,
    responseType,
    submissionOf
  );

  console.log(filter);
  let filterStartDate = filter.startDate;
  let filterEndDate = filter.endDate;

  // console.log('filterStartDate',filterStartDate);
  // console.log("filterEndDate", this.dateFormatUSA(filterEndDate));

  const month = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let response = [];
  const Week = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const getWeekNo = (dayno) => {
    if (dayno <= 7) {
      return Week[0];
    } else if (dayno <= 14) {
      return Week[1];
    } else if (dayno <= 21) {
      return Week[2];
    } else if (dayno > 21) {
      return Week[3];
    } else return null;
  };

  if (responseType == "Weekly") {
    while (
      new Date(filterStartDate).getTime() < new Date(filterEndDate).getTime()
    ) {
      let date = new Date(filterStartDate);

      if (date.getDate() > 28) {
        filterStartDate = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          "01"
        );
      } else {
        let responseEndDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 6
        );

        if (getWeekNo(date.getDate()) == "Week 4") {
          responseEndDate = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0
          );
        }
        response.push({
          week: month[date.getMonth()] + " " + getWeekNo(date.getDate()),
          responseDate: formatDate(filterStartDate),
          responseEndDate: formatDate(responseEndDate),
        });

        filterStartDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 7
        );
      }
    }
  } else if (responseType == "Monthly") {
    // console.log('monthly');
    // console.log("filterStartDate", filterStartDate);
    // console.log("filterEndDate", filterEndDate);
    let j = 1;
    while (
      new Date(filterStartDate).getTime() <= new Date(filterEndDate).getTime()
    ) {
      let date = new Date(filterStartDate);
      let mname = getMonthnoRes(date, responseType, submissionOf);
      if (mname == 12) {
        mname = 0;
      }
      let responseEndDate = endOfMonth(date);
      response.push({
        week: month[date.getMonth()],
        responseDate: formatDate(filterStartDate),
        responseEndDate: formatDate(responseEndDate),
      });
      let edate = new Date(responseEndDate);
      filterStartDate = new Date(
        edate.getFullYear(),
        edate.getMonth(),
        edate.getDate() + 1
      );
      j++;
    }
  } else if (responseType == "Quarterly") {
    let j = 1;
    while (
      new Date(filterStartDate).getTime() <= new Date(filterEndDate).getTime()
    ) {
      let date = new Date(filterStartDate);
      let responseEndDate = endOfQuarter(date);
      let getQMonth = new Date(responseEndDate);
      let mname = getQMonth.getMonth();
      response.push({
        week: month[mname],
        responseDate: formatDate(filterStartDate),
        responseEndDate: responseEndDate,
      });
      date = new Date(date.setDate(date.getDate() + 1));
      let edate = new Date(responseEndDate);

      filterStartDate = new Date(
        edate.getFullYear(),
        edate.getMonth(),
        edate.getDate() + 1
      );
    }
  } else if (responseType == "Biannual") {
    while (
      new Date(filterStartDate).getTime() < new Date(filterEndDate).getTime()
    ) {
      let date = new Date(filterStartDate);
      let responseEndDate = endOfBiannual(date);
      let getQMonth = new Date(responseEndDate);
      let mname = getQMonth.getMonth();
      response.push({
        week: month[mname],
        responseDate: formatDate(filterStartDate),
        responseEndDate: responseEndDate,
      });
      date = new Date(date.setDate(date.getDate() + 1));
      let edate = new Date(responseEndDate);
      filterStartDate = new Date(
        edate.getFullYear(),
        edate.getMonth(),
        edate.getDate() + 1
      );
    }
  } else if (responseType == "Annual") {
    while (
      new Date(filterStartDate).getTime() < new Date(filterEndDate).getTime()
    ) {
      let date = new Date(filterStartDate);
      let responseEndDate = endOfAnnual(date);
      let getQMonth = new Date(responseEndDate);
      let mname = getQMonth.getMonth();
      response.push({
        week: month[mname],
        responseDate: formatDate(filterStartDate),
        responseEndDate: responseEndDate,
      });
      date = new Date(date.setDate(date.getDate() + 1));
      let edate = new Date(responseEndDate);
      filterStartDate = new Date(
        edate.getFullYear(),
        edate.getMonth(),
        edate.getDate() + 1
      );
    }
  }

  return response;
};

exports.getStartDateFromExp = async (expiryDate, response_frequency) => {
  let startDate = expiryDate;
  if (response_frequency == "Weekly") {
    startDate = new Date(expiryDate);
    startDate.setDate(startDate.getDate() - 7);
    //console.log(startDate);
    startDate =
      startDate.getFullYear() +
      "-" +
      (startDate.getMonth() + 1) +
      "-" +
      startDate.getDate();

    // console.log(startDate);
  } else if (response_frequency == "Monthly") {
    startDate = new Date(expiryDate);
    startDate.setMonth(startDate.getMonth() - 1);
    startDate =
      startDate.getFullYear() +
      "-" +
      (startDate.getMonth() + 1) +
      "-" +
      startDate.getDate();
    // console.log(startDate);
  } else if (response_frequency == "Quarterly") {
    startDate = new Date(expiryDate);
    startDate.setMonth(startDate.getMonth() - 3);
    startDate =
      startDate.getFullYear() +
      "-" +
      (startDate.getMonth() + 1) +
      "-" +
      startDate.getDate();
    // console.log(startDate);
  } else if (response_frequency == "Biannual") {
    startDate = new Date(expiryDate);
    startDate.setMonth(startDate.getMonth() - 6);
    startDate =
      startDate.getFullYear() +
      "-" +
      (startDate.getMonth() + 1) +
      "-" +
      startDate.getDate();
    // console.log(startDate);
  } else if (response_frequency == "Annual") {
    startDate = new Date(expiryDate);
    startDate.setFullYear(startDate.getFullYear() - 6);
    startDate =
      startDate.getFullYear() +
      "-" +
      (startDate.getMonth() + 1) +
      "-" +
      startDate.getDate();
    // console.log(startDate);
  }

  return startDate;
};

exports.getUpdatorScore = async (
  req,
  library_id = null,
  user_id,
  usertype = 0
) => {
  // usertype : 0 updator, 1 internal surveyor, 2 external surveyor
  let cond = "    and pm.role_id=4 ";
  let libCond = " ";
  if (usertype == 0) {
    cond = `  and pm.role_id=4 `;
  }

  if (usertype > 0) {
    cond = `  and pm.role_id=5 `;
  }

  if (library_id) {
    libCond = ` and pm.library_id=${library_id} `;
  }

  let sql = `select chp.*  
    from property_mapping pm INNER join chapters chp on pm.chapter_id = chp.id 
    LEFT JOIN score_mapping score on chp.id = score.chapter_id and
    score.organization_id=${req.organization_id}
    where pm.organization_id=${req.organization_id} and chp.status not in (2)  and pm.user_id=${user_id}  ${libCond} 
    ${cond}  group by chp.id
    `;

  //console.log(sql);

  let assignedChapters = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  //console.log(assignedChapters.length);

  if (library_id) {
    libCond = ` and library_id=${library_id} `;
  }

  let chaptersScore = [];
  for (const chapter of assignedChapters) {
    if (usertype == 0) {
      sqlsc = `select (select avg(updator_score * 50) from score_mapping where organization_id=${req.organization_id} ${libCond} and 
        chapter_id='${chapter.id}' and updator_id=${user_id} and standard_id=A.standard_id) as newscore from score_mapping as A where organization_id=${req.organization_id} ${libCond} and 
        chapter_id='${chapter.id}' and updator_id=${user_id} 
        group by standard_id order by substanard_id desc`;
    } else if (usertype == 1) {
      sqlsc = `select (select avg(internal_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} ${libCond} and 
        chapter_id='${chapter.id}' and internal_surveyor_id=${user_id} and standard_id=A.standard_id) as newscore from score_mapping as A where organization_id=${req.organization_id} ${libCond} and 
        chapter_id='${chapter.id}' and internal_surveyor_id=${user_id} 
        group by standard_id order by substanard_id desc`;
    } else if (usertype == 2) {
      sqlsc = `select (select avg(external_surveyor_score * 50) from score_mapping where organization_id=${req.organization_id} ${libCond} and 
        chapter_id='${chapter.id}' and external_surveyor_id=${user_id} and standard_id=A.standard_id) as newscore from score_mapping as A where organization_id=${req.organization_id} ${libCond} and 
        chapter_id='${chapter.id}' and external_surveyor_id=${user_id} 
        group by standard_id order by substanard_id desc`;
    }

    // console.log(sqlsc);

    let userScore = await db.sequelize.query(sqlsc, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (userScore.length > 0) {
      let score =
        userScore.map((el) => +el.newscore).reduce((a, b) => a + b, 0) /
        userScore.length;

      chaptersScore.push(score.toFixed(2));
    }
  }

  //console.log(chaptersScore);

  if (chaptersScore.length > 0) {
    let score =
      chaptersScore.map((el) => +el).reduce((a, b) => a + b, 0) /
      chaptersScore.length;

    //console.log(score);

    return score;
  } else {
    return "";
  }
};

async function uniqArrayDatas(a) {
  return Array.from(new Set(a));
}

exports.getYtDValues = async (kpiscoresList = [], type_of_measure) => {
  //'monthly'=>frequency

  let actualValue = 0;
  let actualScore = 0;

  actualValues = kpiscoresList.map((el) => +el.actual_value);
  actualScore = kpiscoresList.map((el) => +el.score);

  //console.log(actualValues);

  if (type_of_measure == "LowertheBetter") {
    actualValue = calculate(actualValues, "sum");
    actualScore = calculate(actualScore, "avg");
  } else {
    actualValue = calculate(actualValues, "avg");
    actualScore = calculate(actualScore, "avg");
  }

  ytd = {
    actualValue: actualValue,
    actualScore: actualScore,
  };
  return ytd;
};

const calculate = (arr, type) => {
  if ((type = "avg")) {
    let avgValue = arr.reduce((a, b) => a + b, 0) / arr.length;
    return avgValue.toFixed();
  } else if ((type = "sum")) {
    return arr.reduce((a, b) => a + b, 0);
  } else return 0;
};

const MonthList = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

exports.getKPIScoreAndActual = async (
  organization_id,
  admin_activity_id,
  client_activity_id,
  fromDate = null,
  toDate = null
) => {
  // checkIndex = MonthList.findIndex(month=>month==frequency);
  // monthArr = MonthList.filter((el,idx)=>idx<=checkIndex);
  // monthList = getArraytoString(monthArr);

  if (admin_activity_id) {
    cond = ` and admin_activity_id='${admin_activity_id}'`;
  }

  if (client_activity_id) {
    cond = ` and client_activity_id='${client_activity_id}'`;
  }

  if (fromDate && toDate) {
    cond = ` and responsedate between '${fromDate}' and '${toDate}' `;
  }

  let scoreList = await db.sequelize.query(
    `select actual_value,score,frequency from storage_activity_kpi_elements as A left join storage_activity_kpi as B on A.storage_id=B.id where  organization_id=${organization_id} ${cond}`,
    {
      type: db.sequelize.QueryTypes.SELECT,
      raw: true,
    }
  );

  return scoreList;
};

const getArraytoString = (arr) => {
  arr = monthArr.join(",");
  if (arr && arr.includes(",")) {
    temp = arr.split(",");
    quotedAndCommaSeparated = "'" + temp.join("','") + "'";
  } else {
    quotedAndCommaSeparated = "'" + arr + "'";
  }

  return quotedAndCommaSeparated;
};

exports.getUpdatorComplientMetScore = async (scoers) => {
  const uniqueLibs = [...new Set(scoers.map((item) => item.library_id))];
  for (const lib of uniqueLibs) {
    let currentLibScores = scoers.filter((el) => el.library_id == lib);
    //console.log(currentLibScores.length);
    let substandardScores =
      getComplientMetScoreSubStanradScoreDetail(currentLibScores);
    let StandardScore =
      getComplientMetScoreStanradScoreDetail(currentLibScores);
    let chapterScore = getComplientMetScoreChapterScoreDetail(currentLibScores);
  }
};

const getComplientMetScoreSubStanradScoreDetail = (currentLibScores) => {
  const totalSubstandard = [
    ...new Set(currentLibScores.map((item) => item.substanard_id)),
  ].length;
  const totalSubstandardmet = currentLibScores.filter(
    (item) => item.updator_score > 0
  ).length;
  const totalSubstandardmetPer = (totalSubstandardmet / totalSubstandard) * 100;
  const totalSubstandardnotMet = currentLibScores.filter(
    (item) => item.updator_score == 0
  ).length;
  const totalSubstandardnotMetPer =
    (totalSubstandardnotMet / totalSubstandard) * 100;
  const totalSubstandardNA = currentLibScores.filter(
    (item) => item.updator_score < 0
  ).length;
  const totalSubstandardNAPer = (totalSubstandardNA / totalSubstandard) * 100;

  return {
    totalSubstandard,
    totalSubstandardmet,
    totalSubstandardmetPer,
    totalSubstandardnotMet,
    totalSubstandardnotMetPer,
    totalSubstandardNA,
    totalSubstandardNAPer,
  };
};

const getComplientMetScoreStanradScoreDetail = (currentLibScores) => {
  const uniqueStandards = [
    ...new Set(currentLibScores.map((item) => item.standard_id)),
  ];

  let scoresList = [];

  for (const element of uniqueStandards) {
    let totalStandardFilter = currentLibScores.filter(
      (el) => el.standard_id == element
    );
    let scores = getComplientMetScoreSubStanradScoreDetail(totalStandardFilter);
    //  console.log(scores);
    scoresList.push(scores);
  }
  //console.log(scoresList);

  //const totalSubstandard: 5,
  const totalStandardmet = scoresList.reduce((a, b) => {
    return a + b.totalSubstandardmet;
  }, 0);
  const totalStandardmetPer =
    scoresList.reduce((a, b) => {
      // console.log(b.totalSubstandardmetPer);
      return a + b.totalSubstandardmetPer;
    }, 0) / scoresList.length;
  const totalStandardnotMet = scoresList.reduce(
    (a, b) => a + b.totalSubstandardnotMet,
    0
  );
  const totalStandardnotMetPer =
    scoresList.reduce((a, b) => a + b.totalSubstandardnotMetPer, 0) /
    scoresList.length;
  const totalStandardNA = scoresList.reduce(
    (a, b) => a + b.totalSubstandardNA,
    0
  );
  const totalStandardNAPer =
    scoresList.reduce((a, b) => a + b.totalSubstandardNAPer, 0) /
    scoresList.length;

  return {
    totalStandardmet,
    totalStandardmetPer,
    totalStandardnotMet,
    totalStandardnotMetPer,
    totalStandardNA,
    totalStandardNAPer,
  };
};

const getComplientMetScoreChapterScoreDetail = (currentLibScores) => {
  const uniqueChapters = [
    ...new Set(currentLibScores.map((item) => item.chapter_id)),
  ];
  scoresList = [];
  for (const element of uniqueChapters) {
    let totalStandardFilter = currentLibScores.filter(
      (el) => el.chapter_id == element
    );

    let scores = getComplientMetScoreStanradScoreDetail(totalStandardFilter);
    //  console.log(scores);
    scoresList.push(scores);
  }

  const totalChaptermet = scoresList.reduce(
    (a, b) => a + b.totalStandardmet,
    0
  );
  const totalChaptermetPer =
    scoresList.reduce((a, b) => a + b.totalStandardmetPer, 0) /
    scoresList.length;
  const totalChapternotMet = scoresList.reduce(
    (a, b) => a + b.totalStandardnotMet,
    0
  );
  const totalChapternotMetPer =
    scoresList.reduce((a, b) => a + b.totalStandardnotMetPer, 0) /
    scoresList.length;
  const totalChapterNA = scoresList.reduce((a, b) => a + b.totalStandardNA, 0);
  const totalChapterNAPer =
    scoresList.reduce((a, b) => a + b.totalStandardNAPer, 0) /
    scoresList.length;

  return {
    totalChaptermet,
    totalChaptermetPer,
    totalChapternotMet,
    totalChapternotMetPer,
    totalChapterNA,
    totalChapterNAPer,
  };
};

exports.removeDuplicatesFromArrayObj = (originalArray, prop) => {
  let newArray = [];
  let lookupObject = {};

  for (let i in originalArray) {
    lookupObject[originalArray[i][prop]] = originalArray[i];
  }

  for (i in lookupObject) {
    newArray.push(lookupObject[i]);
  }
  return newArray;
};

exports.addAssignPropertiesinClientAdmin = async (req) => {
  const properties = [];
  if (req.body.substandard_id != null && req.body.substandard_id.length > 0) {
    let key = 0;
    let substandard_ids = req.body.substandard_id.filter(
      (el) => el.mapping_id == null
    );
    substandard_ids = req.body.substandard_id.map((sub) => sub.id);
    substandard_ids = uniqArrayList(substandard_ids);
    for (const sub_id of substandard_ids) {
      let finaldata = await db.sequelize.query(
        `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      let admin_activity_id_mapping = crypto
        .createHash("sha256")
        .update(
          req.body.name +
            "_" +
            finaldata[0].id +
            "_" +
            finaldata[0].standard_id +
            "_" +
            finaldata[0].chapter_id +
            "_" +
            finaldata[0].library_id
        )
        .digest("hex");

      if (req.role_id > 2) {
        //assigned can be same but organization can be diffrent
        admin_activity_id_mapping = crypto
          .createHash("sha256")
          .update(
            req.body.name +
              "_" +
              finaldata[0].id +
              "_" +
              finaldata[0].standard_id +
              "_" +
              finaldata[0].chapter_id +
              "_" +
              finaldata[0].library_id +
              "_" +
              req.organization_id
          )
          .digest("hex");
      }

      let checkDuplicate = await db.activity_mapping.findAll({
        where: {
          library_id: finaldata[0].library_id,
          chapter_id: finaldata[0].chapter_id,
          standard_id: finaldata[0].standard_id,
          substandard_id: finaldata[0].id,
          client_activity_id: req.body.client_activity_id,
          admin_activity_id: req.body.admin_activity_id,
          organization_id: {
            [Op.in]: [0, req.organization_id],
          },
        },
      });

      if (checkDuplicate.length == 0) {
        properties.push({
          id: admin_activity_id_mapping,
          library_id: finaldata[0].library_id,
          chapter_id: finaldata[0].chapter_id,
          standard_id: finaldata[0].standard_id,
          substandard_id: finaldata[0].id,
          client_activity_id: req.body.client_activity_id,
          admin_activity_id: req.body.admin_activity_id,
          status: master.status.active,
          organization_id: req.organization_id,
        });
      }

      if (substandard_ids.length == key + 1) {
        if (properties.length > 0) {
          db.activity_mapping.bulkCreate(properties).then((result) => true);
        } else {
          return true;
        }
      }

      key = key + 1;
    }
  }
  /*
  if (
    req.body.updatedSubstandards != null &&
    req.body.updatedSubstandards.length > 0
  ) {
    substandard_ids = req.body.updatedSubstandards.map((sub) => sub.id);
    substandard_ids.forEach((sub_id, key) => {
      db.sequelize
        .query(
          `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then(async (finaldata) => {
          //console.log(finaldata);
          ///step4-activity_mapping create

          var admin_activity_id_mapping = crypto
            .createHash("sha256")
            .update(
              req.body.name +
                "_" +
                finaldata[0].id +
                "_" +
                finaldata[0].standard_id +
                "_" +
                finaldata[0].chapter_id +
                "_" +
                finaldata[0].library_id
            )
            .digest("hex");
          db.activity_mapping
            .upsert({
              id: admin_activity_id_mapping,
              library_id: finaldata[0].library_id,
              chapter_id: finaldata[0].chapter_id,
              standard_id: finaldata[0].standard_id,
              substandard_id: finaldata[0].id,
              client_activity_id: req.body.client_activity_id,
              admin_activity_id: req.body.admin_activity_id,
              status: master.status.active,
              organization_id: req.organization_id,
            })
            .then((mappingdata) => {
              if (key + 1 == req.body.substandard_id.length) {
                res.send({ message: "Updated Successfully" });
              }
            });  

          db.activity_mapping
            .create({
              id: admin_activity_id_mapping,
              library_id: finaldata[0].library_id,
              chapter_id: finaldata[0].chapter_id,
              standard_id: finaldata[0].standard_id,
              substandard_id: finaldata[0].id,
              client_activity_id: req.body.client_activity_id,
              admin_activity_id: req.body.admin_activity_id,
              status: master.status.active,
              organization_id: req.organization_id,
            })
            .then((mappingdata) => {
              if (key + 1 == req.body.updatedSubstandards.length) {
                res.send({ message: "Updated Successfully" });
              }
            });
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    });
  } else {
    return res.send({ message: "Updated Successfully" });
  } */
};

const uniqArrayList = (a) => {
  return Array.from(new Set(a));
};

exports.activitySessionMappingInsert = async (
  req,
  activity_id,
  isUpdate = 0
) => {
  if (req.role_id == 1) {
    console.log("admin activity");
    const unique_substandard_id_list = req.body.substandard_id
      .filter(
        (substandard, index, self) =>
          index ===
          self.findIndex(
            (t) =>
              t.id === substandard.id &&
              t.session_class_id === substandard.session_class_id
          )
      )
      .filter((el) => el.mapping_id == null);

    let unic_substandards_arr = [];

    unique_substandard_id_list.forEach((el, idx) => {
      let session = el.session_class_id;
      let obj = {};
      //  console.log(session.includes(","));
      if (session && session.includes(",")) {
        let session_arr = session.split(",");

        for (const sessionEl of session_arr) {
          if (sessionEl) {
            let uniqueActivityMappingId =
              el.id + "_" + sessionEl + "_" + activity_id;

            obj = {
              id: uniqueActivityMappingId,
              substandard_id: el.id,
              session_class_id: sessionEl,
              admin_activity_id: activity_id,
              status: 1,
              isUpdate: isUpdate,
            };
            unic_substandards_arr.push(obj);
          }
        }
      } else {
        let uniqueActivityMappingId =
          el.id + "_" + el.session_class_id + "_" + activity_id;
        obj = {
          id: uniqueActivityMappingId,
          substandard_id: el.id,
          session_class_id: el.session_class_id,
          admin_activity_id: activity_id,
          status: 1,
          isUpdate: isUpdate,
        };
        unic_substandards_arr.push(obj);
      }
    });

    const activitySessionMappingArr = await db.activity_session_mapping.findAll(
      {
        where: {
          admin_activity_id: activity_id,
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
      }
    );

    const finalUniqueArr = getDifference(
      unic_substandards_arr,
      activitySessionMappingArr
    );

    //return finalUniqueArr;
    if (finalUniqueArr.length > 0) {
      try {
        return await db.activity_session_mapping.bulkCreate(finalUniqueArr);
      } catch (error) {
        console.log(error);
      }
    } else {
      return true;
    }
  } else {
    // client admin
    console.log("client admin update");

    const unique_substandard_id_list = req.body.substandard_id
      .filter(
        (substandard, index, self) =>
          index ===
          self.findIndex(
            (t) =>
              t.id === substandard.id &&
              t.session_class_id === substandard.session_class_id
          )
      )
      .filter((el) => el.mapping_id == null);

    let unic_substandards_arr = [];

    let actCond = {};

    if (req.body.admin_activity_id) {
      actCond = {
        admin_activity_id: activity_id,
      };
    } else {
      actCond = {
        client_activity_id: activity_id,
      };
    }

    //console.log(unique_substandard_id_list);
    /*if (
      req.body.remove_substandard_ids !== undefined &&
      req.body.remove_substandard_ids !== null &&
      req.body.remove_substandard_ids.length > 0
    ) {
      await db.activity_session_mapping.destroy({
        where: {
          ...actCond,
          substandard_id: {
            [Op.in]: remove_substandard_ids,
          },
          organization_id: req.organization_id,
        },
      })    ;
    } */

    unique_substandard_id_list.forEach((el, idx) => {
      let session = el.session_class_id;
      let obj = {};
      //  console.log(session.includes(","));
      if (session && session.includes(",")) {
        let session_arr = session.split(",");

        for (const sessionEl of session_arr) {
          if (sessionEl) {
            let uniqueActivityMappingId =
              el.id +
              "_" +
              sessionEl +
              "_" +
              activity_id +
              "_" +
              req.organization_id;

            obj = {
              id: uniqueActivityMappingId,
              substandard_id: el.id,
              session_class_id: sessionEl,
              ...actCond,
              organization_id: req.organization_id,
              status: 1,
              isUpdate: isUpdate,
            };
            unic_substandards_arr.push(obj);
          }
        }
      } else {
        let uniqueActivityMappingId =
          el.id +
          "_" +
          el.session_class_id +
          "_" +
          activity_id +
          "_" +
          req.organization_id;
        obj = {
          id: uniqueActivityMappingId,
          substandard_id: el.id,
          session_class_id: el.session_class_id,
          organization_id: req.organization_id,
          ...actCond,
          status: 1,
          isUpdate: isUpdate,
        };
        unic_substandards_arr.push(obj);
      }
    });

    console.log("basant...... ", actCond);

    const activitySessionMappingArr = await db.activity_session_mapping.findAll(
      {
        where: {
          ...actCond,
          [Op.or]: [
            {
              organization_id: {
                [Op.eq]: null,
              },
            },
            {
              organization_id: {
                [Op.eq]: 25,
              },
            },
            {
              organization_id: {
                [Op.eq]: req.organization_id,
              },
            },
          ],
        },
        //logging: console.log,
      }
    );

    const finalUniqueArr = getDifference(
      unic_substandards_arr,
      activitySessionMappingArr,
      req.organization_id
    );

    console.log("basant uuu ", finalUniqueArr);

    //return finalUniqueArr;
    //  if (finalUniqueArr.length > 0 && isUpdate == 0) {
    if (finalUniqueArr.length > 0) {
      await db.activity_session_mapping
        .bulkCreate(finalUniqueArr)
        .catch((error) => console.log(error));

      return true;
    } else {
      return true;
    }
  }
};

//get unique value from array object
const getDifference = (array1, array2, organization_id) => {
  console.log(array1.length);
  if (array1.length > 0 && array2.length > 0) {
    return array1.filter((object1) => {
      return !array2.find((object2) => {
        // console.log(object1.substanard_id, object2.substandard_id);
        return object1.substandard_id == object2.substandard_id;
        // return (
        //   object1.substandard_id == object2.substandard_id &&
        //   object1.session_class_id == object2.session_class_id
        // );
      });
    });

    // return array1.filter((obj1) => {
    //   return !array2.find(
    //     (obj2) =>
    //       obj2.substanard_id == obj1.substandard_id &&
    //       obj2.session_class_id == obj1.session_class_id
    //   );
    // });
  } else {
    return array1;
  }
};

exports.getLibraryScoreUpdatorSurveyorComp = async (
  req,
  library_id,
  user_id,
  usertype = 0,
  session_class_id = null,
  chapter_id = null,
  standard_id = null,
  substandard_id = null,
  organization_id = req.organization_id,
  fromDate = null,
  toDate = null,
  props = null
) => {
  // usertype : 0 updator, 1 internal surveyor, 2 external surveyor
  let propsCond = "";
  if (props && props.length > 0) {
    let quotedProps = "'" + props.join("','") + "'";
    propsCond = ` and substandard_id in (${quotedProps})`;
  }

  if (usertype == 0) {
    let useridcondPM = "";
    let useridcond = ` && library_id=${library_id}  `;

    if (user_id && usertype == 0 && req.role_id > 3) {
      //useridcond = useridcond + ` && updator_id=${user_id}`;
      useridcondPM = ` && user_id=${user_id} `;
    }

    if (chapter_id) {
      useridcond = useridcond + ` && chapter_id=${chapter_id}`;
      useridcondPM = useridcondPM + ` && chapter_id='${chapter_id}'`;
    }

    if (standard_id) {
      useridcond = useridcond + ` && standard_id='${standard_id}'`;
      useridcondPM = useridcondPM + ` && standard_id='${standard_id}'`;
    }

    if (substandard_id) {
      useridcond = useridcond + ` && substandard_id='${substandard_id}'`;
      useridcondPM = useridcondPM + ` && substandard_id='${substandard_id}'`;
    }

    let dateScoreFilter = "";

    if (fromDate && toDate) {
      dateScoreFilter = ` && date_format(updator_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    let property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=4  && (status is null || status=1)  ${useridcondPM} ${propsCond}  group by substandard_id `;

    let score_mapping = ` select * from score_mapping where organization_id=${organization_id}  ${dateScoreFilter} && updator_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;

    let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

    if (user_id) {
      let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
      (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
      (select *,avg(updator_score * 50) as newupdator_score from 
      ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.updator_score is null then 0 else B.updator_score end ) >=0 )
         as scorestd   group by standard_id order by standard_id) 
        as scorechp group by chapter_id order by chapter_id)
      as libscore where library_id=${library_id} group by library_id`;

      const libScore = await db.sequelize.query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (libScore.length > 0) {
        return libScore[0].score;
      }
    } else {
      //console.log(organization_id);
      const usersList = await db.users.findAll({
        where: {
          organization_id: organization_id,
          role_id: 4,
        },
      });

      let newscores = [];

      for (const element of usersList) {
        let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
        (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
        (select *,avg(updator_score * 50) as newupdator_score from 
        ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
        where (case when B.updator_score is null then 0 else B.updator_score end ) >=0) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
        as libscore where library_id=${library_id} group by library_id`;
        // console.log(sql);
        // console.log("-------------------------");
        const libScore = await db.sequelize.query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        });
        if (libScore.length > 0) {
          newscores.push(+libScore[0].score);
        }
      }

      let avgScore = newscores.reduce((a, b) => a + b, 0) / newscores.length;
      return avgScore.toFixed(2);
    }
  } else {
    let useridcondPM = "";
    let dateScoreFilter = "";
    let surveyorScoreCond = "internal_surveyor_score";
    if (usertype == 2) {
      surveyorScoreCond = "external_surveyor_score";
    }

    if (fromDate && toDate) {
      dateScoreFilter = ` && date_format(internal_surveyor_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
      if (usertype == 2) {
        dateScoreFilter = ` && date_format(external_surveyor_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
      }
    }
    property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=5  && (status is null || status=1)  ${useridcondPM} ${propsCond} group by substandard_id `;
    score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${dateScoreFilter} && ${surveyorScoreCond} is not null && library_id=${library_id}  group by substanard_id order by id desc `;
    fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
 (case when B.${surveyorScoreCond} is null then 0 else B.${surveyorScoreCond} end ) as ${surveyorScoreCond} `;

    if (user_id) {
      if (user_id && usertype > 0 && req.role_id > 3) {
        useridcondPM = ` and user_id=${user_id}`;
      }

      property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=5  && (status is null || status=1)  ${useridcondPM} ${propsCond} group by substandard_id `;

      let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
      (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
      (select *,avg(${surveyorScoreCond} * 50) as newupdator_score from 
      ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.${surveyorScoreCond} is null then 0 else B.${surveyorScoreCond} end ) >=0  ) 
        as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
      as libscore where library_id=${library_id} group by library_id`;

      // console.log(sql);
      const libScore = await db.sequelize.query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (libScore.length > 0) {
        return libScore[0].score;
      }
    } else {
      //console.log(organization_id);
      const usersList = await db.users.findAll({
        where: {
          organization_id: organization_id,
          role_id: 5,
          surveyor_type: usertype,
        },
      });

      let newscores = [];

      for (const element of usersList) {
        let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
        (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
        (select *,avg(${surveyorScoreCond}  * 50) as newupdator_score from 
        (  select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
        where (case when B.${surveyorScoreCond} is null then 0 else B.${surveyorScoreCond} end ) >=0   ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
        as libscore where library_id=${library_id} group by library_id`;
        //console.log(sql);
        // console.log("-------------------------");
        const libScore = await db.sequelize.query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        });
        if (libScore.length > 0) {
          newscores.push(+libScore[0].score);
        }
      }

      let avgScore = newscores.reduce((a, b) => a + b, 0) / newscores.length;
      return avgScore.toFixed(2);
    }
  }

  return null;
};

exports.getLibraryScoreUpdatorSurveyorCompSuperAdmin = async (
  req,
  library_id,
  user_id,
  usertype = 0,
  organization = req.organization_id,
  fromDate = null,
  toDate = null
) => {
  // usertype : 0 updator, 1 internal surveyor, 2 external surveyor
  let filterDate = "";
  if (usertype == 0) {
    let useridcondPM = "";

    if (fromDate && toDate) {
      filterDate = ` and DATE_FORMAT(updator_assesment_date, "%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }
    let property_mapping = ` select * from property_mapping where organization_id=${organization} && library_id=${library_id}  && role_id=4  && (status is null || status=1)  ${useridcondPM}  group by substandard_id `;

    let score_mapping = ` select * from score_mapping where organization_id=${organization} ${filterDate} && updator_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;

    let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

    if (user_id) {
      let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
      (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
      (select *,avg(updator_score * 50) as newupdator_score from 
      ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.updator_score is null then 0 else B.updator_score end ) >=0 )
         as scorestd   group by standard_id order by standard_id) 
        as scorechp group by chapter_id order by chapter_id)
      as libscore where library_id=${library_id} group by library_id`;

      //console.log(sql);
      const libScore = await db.sequelize.query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (libScore.length > 0) {
        return libScore[0].score;
      }
    } else {
      //console.log(req.organization_id);
      const usersList = await db.users.findAll({
        where: {
          organization_id: organization,
          role_id: 4,
        },
      });

      let newscores = [];

      for (const element of usersList) {
        let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
        (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
        (select *,avg(updator_score * 50) as newupdator_score from 
        ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
        where (case when B.updator_score is null then 0 else B.updator_score end ) >=0) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
        as libscore where library_id=${library_id} group by library_id`;

        const libScore = await db.sequelize.query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        });
        if (libScore.length > 0) {
          newscores.push(+libScore[0].score);
        }
      }

      let avgScore = newscores.reduce((a, b) => a + b, 0) / newscores.length;
      return avgScore.toFixed(2);
    }
  } else {
    let useridcondPM = "";
    let surveyorScoreCond = "internal_surveyor_score";
    if (usertype == 2) {
      surveyorScoreCond = "external_surveyor_score";
    }

    if (fromDate && toDate) {
      filterDate = ` and DATE_FORMAT(updator_assesment_date, "%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    property_mapping = ` select * from property_mapping where organization_id=${organization} && library_id=${library_id}  && role_id=5  && (status is null || status=1)  ${useridcondPM}  group by substandard_id `;
    score_mapping = ` select * from score_mapping where organization_id=${organization} ${filterDate} && ${surveyorScoreCond} is not null && library_id=${library_id}  group by substanard_id order by id desc `;
    fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
 (case when B.${surveyorScoreCond} is null then 0 else B.${surveyorScoreCond} end ) as ${surveyorScoreCond} `;

    if (user_id) {
      let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
      (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
      (select *,avg(${surveyorScoreCond} * 50) as newupdator_score from 
      ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
      where (case when B.${surveyorScoreCond} is null then 0 else B.${surveyorScoreCond} end ) >=0  ) 
        as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
      as libscore where library_id=${library_id} group by library_id`;

      //console.log(sql);
      const libScore = await db.sequelize.query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (libScore.length > 0) {
        return libScore[0].score;
      }
    } else {
      //console.log(req.organization_id);
      const usersList = await db.users.findAll({
        where: {
          organization_id: organization,
          role_id: 5,
          surveyor_type: usertype,
        },
      });

      let newscores = [];

      for (const element of usersList) {
        let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
        (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
        (select *,avg(${surveyorScoreCond}  * 50) as newupdator_score from 
        (  select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
        where (case when B.${surveyorScoreCond} is null then 0 else B.${surveyorScoreCond} end ) >=0   ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
        as libscore where library_id=${library_id} group by library_id`;
        //console.log(sql);
        // console.log("-------------------------");
        const libScore = await db.sequelize.query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        });
        if (libScore.length > 0) {
          newscores.push(+libScore[0].score);
        }
      }

      let avgScore = newscores.reduce((a, b) => a + b, 0) / newscores.length;
      return avgScore.toFixed(2);
    }
  }

  return null;
};

exports.getLibraryScoreSurveyorComp = async (
  req,
  library_id,
  user_id,
  usertype = 0,
  session_class_id = null,
  chapter_id = null,
  standard_id = null,
  substandard_id = null,
  organization_id = req.organization_id,
  fromDate = null,
  toDate = null,
  props = null
) => {
  // usertype : 0 updator, 1 internal surveyor, 2 external surveyor
  organization_id = req.organization_id;
  let cond = "    and pm.role_id=4 ";
  let useridcond = "";

  let propsCond = "";
  if (props && props.length > 0) {
    let quotedProps = "'" + props.join("','") + "'";
    propsCond = ` and substandard_id in (${quotedProps})`;
  }
  if (chapter_id) {
    useridcond = ` && chapter_id=${chapter_id}`;
  }

  if (standard_id) {
    useridcond = ` && standard_id=${standard_id}`;
  }

  if (substandard_id) {
    useridcond = ` && substandard_id=${substandard_id}`;
  }

  if (usertype == 0) {
    cond = `  and pm.role_id=4 `;

    let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
    (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
    (select *,avg(updator_score * 50) as newupdator_score from 
    ( select * from score_mapping where organization_id=${req.organization_id} && updator_score >=0  && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id} 
      && user_id=${user_id} ) ${useridcond}  group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
    as libscore where library_id=${library_id} group by library_id`;
    // console.log(getLibraryScoreUpdator);
    const libScore = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (libScore.length > 0) {
      return libScore[0].score;
    }
  }

  if (usertype > 0) {
    if (!user_id) {
      if (usertype == 1) {
        const usersList = await db.users.findAll({
          where: {
            organization_id: req.organization_id,
            role_id: 5,
            surveyor_type: usertype,
          },
        });

        let newscores = [];

        for (const element of usersList) {
          if (req.role_id > 3) {
            useridcond = ` and user_id=${element.id}`;
          }

          // useridcond = ` and user_id=${element.id}`;

          if (chapter_id) {
            useridcond = useridcond + ` && chapter_id='${chapter_id}'`;
          }

          if (standard_id) {
            useridcond = useridcond + ` && standard_id='${standard_id}'`;
          }

          if (substandard_id) {
            useridcond = useridcond + ` && substandard_id='${substandard_id}'`;
          }

          let property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=5  && (status is null || status = 1 )  ${useridcond} ${propsCond}  group by substandard_id `;

          let score_mapping = ` select * from score_mapping where organization_id=${organization_id} && internal_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;

          let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
(case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) as internal_surveyor_score `;

          let score_mapping_q = `
select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
where (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0 
`;

          //   let sql = `select ROUND(avg(chpupdatorscore),2) as score  from
          // (select  ROUND(avg(newinternal_surveyor_score),2) as chpupdatorscore,library_id from
          // (select *,avg(internal_surveyor_score * 50) as newinternal_surveyor_score from
          // ( select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score >=0
          //   && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id}
          //   && user_id=${element.id} ) ${useridcond}   group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
          // as libscore where library_id=${library_id} group by library_id`;

          let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
        (select  ROUND(avg(newinternal_surveyor_score),2) as chpupdatorscore,library_id from 
        (select *,avg(internal_surveyor_score * 50) as newinternal_surveyor_score from 
        ( ${score_mapping_q}  ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
        as libscore where library_id=${library_id} group by library_id`;
          console.log("**************start**************");
          console.log(sql);
          // console.log("****************************");

          const libScore = await db.sequelize.query(sql, {
            type: db.sequelize.QueryTypes.SELECT,
          });

          if (libScore.length > 0) {
            newscores.push(+libScore[0].score);
          }
        }

        let avgScore = newscores.reduce((a, b) => a + b, 0) / newscores.length;
        return avgScore.toFixed(2);
      } else {
        const usersList = await db.users.findAll({
          where: {
            organization_id: req.organization_id,
            role_id: 5,
            surveyor_type: usertype,
          },
        });

        let newscores = [];

        for (const element of usersList) {
          if (req.role_id > 3) {
            useridcond = ` and user_id=${element.id}`;
          }
          if (chapter_id) {
            useridcond = useridcond + ` && chapter_id='${chapter_id}'`;
          }

          if (standard_id) {
            useridcond = useridcond + ` && standard_id='${standard_id}'`;
          }

          if (substandard_id) {
            useridcond = useridcond + ` && substandard_id='${substandard_id}'`;
          }
          let property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=5  && (status is null || status = 1 )  ${useridcond} ${propsCond}  group by substandard_id `;

          let score_mapping = ` select * from score_mapping where organization_id=${organization_id} && external_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;

          let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
(case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) as external_surveyor_score `;

          let score_mapping_q = `
select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
where (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) >=0 
`;

          let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
(select  ROUND(avg(newexternal_surveyor_score),2) as chpupdatorscore,library_id from 
(select *,avg(external_surveyor_score * 50) as newexternal_surveyor_score from 
( ${score_mapping_q} ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
as libscore where library_id=${library_id} group by library_id`;

          // let sql = `select ROUND(avg(chpupdatorscore),2) as score  from
          // (select  ROUND(avg(newexternal_surveyor_score),2) as chpupdatorscore,library_id from
          // (select *,avg(external_surveyor_score * 50) as newexternal_surveyor_score from
          // ( select * from score_mapping where organization_id=${req.organization_id} && external_surveyor_score >=0
          //   && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id}
          //   && user_id=${element.id} ) ${useridcond}   group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
          // as libscore where library_id=${library_id} group by library_id`;

          const libScore = await db.sequelize.query(sql, {
            type: db.sequelize.QueryTypes.SELECT,
          });
          if (libScore.length > 0) {
            newscores.push(+libScore[0].score);
          }
        }
        if (newscores.length > 0) {
          let avgScore =
            newscores.reduce((a, b) => a + b, 0) / newscores.length;
          return avgScore.toFixed(2);
        } else return null;
      }
    } else {
      cond = `  and pm.role_id=5 `;

      let sessionSubQuery = "";
      if (session_class_id && session_class_id != undefined) {
        sessionSubQuery = ` and substanard_id in (select id from sub_standards where session_class_id like'%${session_class_id}%' )`;
      }

      if (usertype == 1) {
        let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
        (select  ROUND(avg(newinternal_surveyor_score),2) as chpupdatorscore,library_id from 
        (select *,avg(internal_surveyor_score * 50) as newinternal_surveyor_score from 
        ( select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score >=0  
          && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id} 
          && user_id=${user_id}  ) ${sessionSubQuery}   group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
        as libscore where library_id=${library_id} group by library_id`;

        console.log(sql);
        return;

        const libScore = await db.sequelize.query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        });

        if (libScore.length > 0) {
          return libScore[0].score;
        }
      } else {
        let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
        (select  ROUND(avg(newexternal_surveyor_score),2) as chpupdatorscore,library_id from 
        (select *,avg(external_surveyor_score * 50) as newexternal_surveyor_score from 
        ( select * from score_mapping where organization_id=${req.organization_id} && external_surveyor_score >=0  && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id} 
          && user_id=${user_id} ) ${sessionSubQuery}   group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
        as libscore where library_id=${library_id} group by library_id`;
        // console.log(getLibraryScoreUpdator);
        const libScore = await db.sequelize.query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        });

        if (libScore.length > 0) {
          return libScore[0].score;
        }
      }
    }
  }
  return null;
};

exports.getSubstandardScoreUpdatorSurv = async (
  req,
  library_id,
  user_id,
  usertype = 0,
  session_class_id = null,
  chapter_id = null,
  standard_id = null,
  substandard_id = null,
  organization_id = req.organization_id,
  fromDate = null,
  toDate = null,
  props = null
) => {
  let useridcond = "";
  let useridcondPM = "";
  let filterDate = "";
  let propsCond = "";
  let clientAdminUsersCond = "";
  if (user_id && req.role_id == 4 && req.role_id > 3) {
    //useridcond = ` && updator_id=${user_id}`;
    useridcondPM = ` && user_id=${user_id} `;
  }

  if (chapter_id) {
    //useridcond = useridcond + ` && chapter_id=${chapter_id}`;
    useridcondPM = useridcondPM + ` && chapter_id='${chapter_id}'`;
  }

  if (standard_id) {
    // useridcond = useridcond + ` && standard_id=${standard_id}`;
    useridcondPM = useridcondPM + ` && standard_id='${standard_id}'`;
  }

  if (substandard_id) {
    // useridcond = useridcond + ` && substandard_id=${substandard_id}`;
    useridcondPM = useridcondPM + ` && substandard_id='${substandard_id}'`;
  }

  if (fromDate && toDate) {
    filterDate = ` and DATE_FORMAT(updator_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
  }

  if (props && props.length > 0) {
    let quotedProps = "'" + props.join("','") + "'";
    propsCond = ` and substandard_id in (${quotedProps})`;
  }

  let property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=4  && (status is null || status=1)  ${useridcondPM} ${propsCond}  group by substandard_id `;

  let score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${filterDate} && updator_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;

  let fields = ` B.id, B.library_id, B.organization_id, B.chapter_id, B.standard_id, B.substanard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
 (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

  let sql = `select avg(updator_score * 50) as score from
  ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.updator_score is null then 0 else B.updator_score end ) >=0  ) as score  `;
  if (usertype == 1) {
    if (user_id && usertype == 1 && req.role_id > 3) {
      useridcond = ` && internal_surveyor_id=${user_id}`;
      useridcondPM = ` && user_id=${user_id} `; //surveyor complience met need to uncomment
    }

    if (fromDate && toDate) {
      filterDate = ` and DATE_FORMAT(internal_surveyor_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }
    if (req.role_id == 2 || req.role_id == 3) {
      clientAdminUsersCond = `  && user_id in (select id from users where organization_id=${organization_id} && surveyor_type=1) `;
    }
    property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=5  && (status is null || status=1) ${clientAdminUsersCond}  ${useridcondPM}  ${propsCond}  group by substandard_id `;
    score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${filterDate} && internal_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
    fields = ` B.id, B.library_id, B.organization_id, B.chapter_id, B.standard_id, B.substanard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
    (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) as internal_surveyor_score,B.external_surveyor_score `;

    sql = `select avg(internal_surveyor_score * 50) as score from
    ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
    where (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0  ) as score  `;
  } else if (usertype == 2) {
    if (user_id && usertype == 2 && req.role_id > 3) {
      useridcond = ` && external_surveyor_id=${user_id}`;
      useridcondPM = ` && user_id=${user_id} `; //surveyor complience met need to uncomment
    }

    if (fromDate && toDate) {
      filterDate = ` and DATE_FORMAT(external_surveyor_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    if (req.role_id == 2 || req.role_id == 3) {
      clientAdminUsersCond = `  && user_id in (select id from users where organization_id=${organization_id} && surveyor_type=2) `;
    }

    property_mapping = ` select * from property_mapping where organization_id=${organization_id} ${filterDate} && library_id=${library_id}  && role_id=5   && (status is null || status=1) ${clientAdminUsersCond}  ${useridcondPM}  ${propsCond}  group by substandard_id `;
    score_mapping = ` select * from score_mapping where organization_id=${organization_id} && external_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
    fields = ` B.id, B.library_id, B.organization_id, B.chapter_id, B.standard_id, B.substanard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
    (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) as external_surveyor_score `;

    // sql = `select avg(external_surveyor_score * 50) as score from
    // ( select * from score_mapping where organization_id=${organization_id} && external_surveyor_score >=0 && library_id=${library_id}  ${useridcond}   group by substanard_id ) as score `;
    sql = `select avg(external_surveyor_score * 50) as score from
    ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
    where (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) >=0  ) as score  `;
  }

  // console.log('-------------------');
  // console.log(sql);
  const substandardScore = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  if (substandardScore.length > 0) {
    return substandardScore[0].score;
  }

  return 0;
};

exports.getStandardScoreUpdatorSurv = async (
  req,
  library_id,
  user_id,
  usertype = 0,
  session_class_id = null,
  chapter_id = null,
  standard_id = null,
  substandard_id = null,
  organization_id = req.organization_id,
  fromDate = null,
  toDate = null,
  props = null
) => {
  let useridcond = ` && library_id=${library_id}  `;
  let useridcondPM = "";
  let filterDate = "";
  let propsCond = "";
  let clientAdminUsersCond = "";
  if (user_id && usertype == 0 && req.role_id > 3) {
    // useridcond = useridcond + ` && updator_id=${user_id}`;
    useridcondPM = ` && user_id=${user_id} `;
  }

  if (chapter_id) {
    //  useridcond = ` && chapter_id=${chapter_id}`;
    useridcondPM = ` && chapter_id='${chapter_id}'`;
  }

  if (standard_id) {
    // useridcond = ` && standard_id=${standard_id}`;
    useridcondPM = ` && standard_id='${standard_id}'`;
  }

  if (substandard_id) {
    useridcondPM = ` && substandard_id='${substandard_id}'`;
  }

  if (fromDate && toDate) {
    filterDate = ` and DATE_FORMAT(updator_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}'`;
  }

  if (props && props.length > 0) {
    let quotedProps = "'" + props.join("','") + "'";
    propsCond = ` and substandard_id in (${quotedProps})`;
  }

  let property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=4  && (status is null || status=1)  ${useridcondPM} ${propsCond}  group by substandard_id `;

  let score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${filterDate} && updator_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;

  let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
 (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

  let sql = `select avg(newupdator_score) as score from (  select  avg(updator_score * 50) as newupdator_score from  
  ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.updator_score is null then 0 else B.updator_score end ) >=0  )  as scorestd   group by standard_id order by standard_id ) avgstd
`;

  if (usertype == 1) {
    if (user_id && usertype == 1 && req.role_id > 3) {
      //useridcond = useridcond + ` && internal_surveyor_id=${user_id}`;
      useridcondPM = ` && user_id=${user_id} `;
    }

    if (fromDate && toDate) {
      filterDate = ` and DATE_FORMAT(internal_surveyor_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}'`;
    }

    if (req.role_id == 2 || req.role_id == 3) {
      clientAdminUsersCond = `  && user_id in (select id from users where organization_id=${organization_id} && surveyor_type=${usertype}) `;
    }

    property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=5  && (status is null || status=1) ${clientAdminUsersCond} ${useridcondPM} ${propsCond}  group by substandard_id `;
    score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${filterDate} && internal_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
    fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
    (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) as internal_surveyor_score,B.external_surveyor_score `;

    //   sql = `select avg(newupdator_score) as score from (  select  avg(internal_surveyor_score * 50) as newupdator_score from
    //   ( select * from score_mapping where internal_surveyor_score >= 0  && organization_id=${organization_id} ${useridcond} group by substanard_id )  as scorestd   group by standard_id order by standard_id ) avgstd
    // `;

    sql = `select avg(newupdator_score) as score from (  select  avg(internal_surveyor_score * 50) as newupdator_score from  
  ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0  )  
  as scorestd   group by standard_id order by standard_id ) avgstd
`;
  } else if (usertype == 2) {
    if (user_id && usertype == 2 && req.role_id > 3) {
      //useridcond = useridcond + ` && external_surveyor_id=${user_id}`;
      useridcondPM = ` && user_id=${user_id} `;
    }

    if (fromDate && toDate) {
      filterDate = ` and DATE_FORMAT(external_surveyor_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}'`;
    }

    if (req.role_id == 2 || req.role_id == 3) {
      clientAdminUsersCond = `  && user_id in (select id from users where organization_id=${organization_id} && surveyor_type=${usertype}) `;
    }

    property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=5  && (status is null || status=1) ${clientAdminUsersCond}  ${useridcondPM} ${propsCond}  group by substandard_id `;
    score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${filterDate} && external_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
    fields = `  B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
 (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) as external_surveyor_score `;

    //   sql = `select avg(newupdator_score) as score from (  select  avg(external_surveyor_score * 50) as newupdator_score from
    //   ( select * from score_mapping where external_surveyor_score >= 0  && organization_id=${organization_id} ${useridcond} group by substanard_id )  as scorestd   group by standard_id order by standard_id ) avgstd
    // `;

    sql = `select avg(newupdator_score) as score from (  select  avg(external_surveyor_score * 50) as newupdator_score from  
  ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) >=0  )  
  as scorestd   group by standard_id order by standard_id ) avgstd
`;
  }

  const substandardScore = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  if (substandardScore.length > 0) {
    return substandardScore[0].score;
  }

  return 0;
};

exports.getChapterScoreUpdatorSurv = async (
  req,
  library_id,
  user_id,
  usertype = 0,
  session_class_id = null,
  chapter_id = null,
  standard_id = null,
  substandard_id = null,
  organization_id = req.organization_id,
  fromDate = null,
  toDate = null,
  props = null
) => {
  let useridcond = ` && library_id=${library_id}  `;
  let useridcondPM = "";
  let filterDate = "";
  let propsCond = "";
  let clientAdminUsersCond = "";
  if (user_id && usertype == 0 && req.role_id > 3) {
    //useridcond = useridcond + ` && updator_id=${user_id}`;
    useridcondPM = ` && user_id=${user_id} `;
  }

  if (chapter_id) {
    useridcond = useridcond + ` && chapter_id=${chapter_id}`;
    useridcondPM = useridcondPM + ` && chapter_id='${chapter_id}'`;
  }

  if (standard_id) {
    useridcond = useridcond + ` && standard_id=${standard_id}`;
    useridcondPM = useridcondPM + ` && standard_id='${standard_id}'`;
  }

  if (substandard_id) {
    useridcond = useridcond + ` && substandard_id=${substandard_id}`;
    useridcondPM = useridcondPM + ` && substandard_id='${substandard_id}'`;
  }

  if (fromDate && toDate) {
    filterDate = ` and DATE_FORMAT(updator_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
  }

  if (props && props.length > 0) {
    let quotedProps = "'" + props.join("','") + "'";
    propsCond = ` and substandard_id in (${quotedProps})`;
  }

  let property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=4  && (status is null || status=1)  ${useridcondPM} ${propsCond} group by substandard_id `;

  let score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${filterDate} && updator_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;

  let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
 (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

  // let sql = `   select avg(newupdator_score) as score from (select avg(newupdator_score) as newupdator_score from (  select  *,avg(updator_score * 50) as newupdator_score from
  // ( select * from score_mapping where  updator_score >=0   && organization_id=${organization_id} ${useridcond} group by substanard_id )  as scorestd   group by standard_id order by standard_id ) avgstd group by chapter_id) chpscore`;

  let sql = `   select avg(newupdator_score) as score from (select avg(newupdator_score) as newupdator_score from (  select  *,avg(updator_score * 50) as newupdator_score from  
  ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
  where (case when B.updator_score is null then 0 else B.updator_score end ) >=0  )  
  as scorestd   group by standard_id order by standard_id ) avgstd group by chapter_id) chpscore`;

  if (usertype == 1) {
    if (user_id && usertype == 1 && req.role_id > 3) {
      // useridcond = useridcond + ` && internal_surveyor_id=${user_id}`;
      useridcondPM = ` && user_id=${user_id} `;
    }

    if (fromDate && toDate) {
      filterDate = ` and DATE_FORMAT(internal_surveyor_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    if (req.role_id == 2 || req.role_id == 3) {
      clientAdminUsersCond = `  && user_id in (select id from users where organization_id=${organization_id} && surveyor_type=${usertype}) `;
    }

    property_mapping = ` select * from property_mapping where organization_id=${organization_id}  && library_id=${library_id}  && role_id=5  && (status is null || status=1) ${clientAdminUsersCond} ${useridcondPM} ${propsCond} group by substandard_id `;
    score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${filterDate} && internal_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
    fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) as internal_surveyor_score,B.external_surveyor_score `;

    // sql = `   select avg(newupdator_score) as score from (select avg(newupdator_score) as newupdator_score from (  select  *,avg(internal_surveyor_score * 50) as newupdator_score from
    // ( select * from score_mapping where  internal_surveyor_score >=0   && organization_id=${organization_id} ${useridcond} group by substanard_id )  as scorestd   group by standard_id order by standard_id ) avgstd group by chapter_id) chpscore`;

    sql = `   select avg(newupdator_score) as score from (select avg(newupdator_score) as newupdator_score from (  select  *,avg(internal_surveyor_score * 50) as newupdator_score from  
    ( select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
    where (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0 )  
    as scorestd   group by standard_id order by standard_id ) avgstd group by chapter_id) chpscore`;
  } else if (usertype == 2) {
    if (user_id && usertype == 2 && req.role_id > 3) {
      // useridcond = useridcond + ` && external_surveyor_id=${user_id}`;
      useridcondPM = ` && user_id=${user_id} `;
    }

    if (fromDate && toDate) {
      filterDate = ` and DATE_FORMAT(external_surveyor_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    if (req.role_id == 2 || req.role_id == 3) {
      clientAdminUsersCond = `  && user_id in (select id from users where organization_id=${organization_id} && surveyor_type=${usertype}) `;
    }

    property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=5  && (status is null || status=1) ${clientAdminUsersCond} ${useridcondPM} ${propsCond} group by substandard_id `;
    score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${filterDate} && external_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
    fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) as external_surveyor_score `;

    // sql = `   select avg(newupdator_score) as score from (select avg(newupdator_score) as newupdator_score from (  select  *,avg(external_surveyor_score * 50) as newupdator_score from
    // ( select * from score_mapping where  external_surveyor_score >=0   && organization_id=${organization_id} ${useridcond} group by substanard_id )  as scorestd   group by standard_id order by standard_id ) avgstd group by chapter_id) chpscore`;

    sql = `   select avg(newupdator_score) as score from (select avg(newupdator_score) as newupdator_score from (  select  *,avg(external_surveyor_score * 50) as newupdator_score from  
    (select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
    where (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) >=0  ) 
     as scorestd   group by standard_id order by standard_id ) avgstd group by chapter_id) chpscore`;
  }

  const substandardScore = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  //console.log(substandardScore);

  if (substandardScore.length > 0) {
    return substandardScore[0].score;
  }

  return 0;
};

exports.getLibraryScoreByBranchSuperAdmin = async (
  req,
  organization_id,
  library_id,
  surveyortype,
  fromDate,
  toDate
) => {
  let role_id = 4;

  if (surveyortype > 0) {
    role_id = 5;
  }
  let usersList = null;
  if (role_id == 4) {
    usersList = await db.users.findAll({
      where: {
        organization_id: organization_id,
        role_id: role_id,
        status: { [Op.ne]: 2 },
      },
    });
  } else {
    usersList = await db.users.findAll({
      where: {
        organization_id: organization_id,
        role_id: role_id,
        surveyor_type: surveyortype,
        status: { [Op.ne]: 2 },
      },
    });
  }

  let newscores = [];

  for (const element of usersList) {
    let score = null;
    if (surveyortype == 0) {
      score = await getLibraryScoreUpdatorById(
        req,
        library_id,
        element.id,
        0,
        organization_id,
        fromDate,
        toDate
      );
    } else {
      score = await getLibraryScoreSurveyorById(
        req,
        library_id,
        element.id,
        element.surveyor_type,
        organization_id,
        fromDate,
        toDate
      );
    }
    // console.log("...score", score);

    newscores.push(+score);
  }

  if (newscores.length > 0) {
    let avgScore = newscores.reduce((a, b) => a + b, 0) / newscores.length;
    return avgScore.toFixed(2);
  }
  return null;
};

exports.getLibraryScoreByBranch = async (
  req,
  organization_id,
  library_id,
  surveyortype
) => {
  let role_id = 4;
  let libCond = "";

  if (library_id) {
    libCond = ` and library_id=${library_id} `;
  }
  if (surveyortype > 0) {
    role_id = 5;
  }
  let usersList = null;

  if (role_id == 4) {
    usersList = await db.sequelize.query(
      `select B.* from property_mapping as A left join users as B on A.user_id= B.id
    where A.organization_id=${organization_id} and A.role_id=${role_id} ${libCond}  and B.status not in(2)  and (A.status not in(2) or A.status is null )  group by library_id,user_id`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
  } else {
    usersList = await db.sequelize.query(
      `select B.* from property_mapping as A left join users as B on A.user_id= B.id
    where A.organization_id=${organization_id} and A.role_id=${role_id} and surveyor_type=${surveyortype} ${libCond}  and B.status not in(2)  and (A.status not in(2) or A.status is null )  group by library_id,user_id`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
  }

  let newscores = [];

  for (const element of usersList) {
    let score = null;
    if (surveyortype == 0) {
      // score = await getLibraryScoreUpdatorById(
      //   req,
      //   library_id,
      //   element.id,
      //   0,
      //   organization_id
      // );

      score = await exports.getLibraryScoreUpdatorSurveyorComp(
        req,
        library_id,
        element.id,
        surveyortype,
        null,
        null,
        null,
        null,
        organization_id,
        null,
        null
      );
    } else {
      // score = await getLibraryScoreSurveyorById(
      //   req,
      //   library_id,
      //   element.id,
      //   element.surveyor_type,
      //   organization_id,
      //   null,
      //   req.body.fromdate,
      //   req.body.todate
      // );

      score = await exports.getLibraryScoreUpdatorSurveyorComp(
        req,
        library_id,
        element.id,
        surveyortype,
        null,
        null,
        null,
        null,
        organization_id,
        null,
        null
      );
    }
    // console.log("...score", score);

    newscores.push(+score);
  }

  if (newscores.length > 0) {
    let avgScore = newscores.reduce((a, b) => a + b, 0) / newscores.length;
    return avgScore.toFixed(2);
  }
  return null;
};

const getLibraryScoreUpdatorById = async (
  req,
  library_id,
  user_id,
  usertype = 0,
  organization_id = req.organization_id
) => {
  // usertype : 0 updator, 1 internal surveyor, 2 external surveyor

  let fromDate = req.body.fromdate;
  let toDate = req.body.todate;

  if (usertype == 0) {
    let dateCond = "";

    if (fromDate && fromDate != "" && toDate && toDate != "") {
      dateCond = ` && DATE_FORMAT(updator_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    let property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=4  && (status is null || status=1 )  && user_id=${user_id}   group by substandard_id `;

    let score_mapping = ` select * from score_mapping where organization_id=${organization_id} && updator_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;

    let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
   (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

    let score_mapping_q = `
   select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
   where (case when B.updator_score is null then 0 else B.updator_score end ) >=0 ${dateCond}
   `;

    let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
   (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
   (select *,avg(updator_score * 50) as newupdator_score from 
   ( ${score_mapping_q} ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
   as libscore where library_id=${library_id} group by library_id`;

    const libScore = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    //console.log(libScore);
    if (libScore.length > 0) {
      return libScore[0].score;
    }
  }

  return null;
};

getLibraryScoreSurveyorById = async (
  req,
  library_id,
  user_id,
  usertype = 0,
  organization_id = req.organization_id,
  session_class_id = null,
  fromDate = null,
  toDate = null
) => {
  // usertype : 0 updator, 1 internal surveyor, 2 external surveyor

  let datefilter = "";
  if (fromDate && toDate) {
    datefilter = ` and DATE_FORMAT(updator_assesment_date,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
  }

  let property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=4  && status is null  && user_id=${user_id}   group by substandard_id `;

  let score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${datefilter} && updator_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;

  let fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
 (case when B.updator_score is null then 0 else B.updator_score end ) as updator_score,B.internal_surveyor_score,B.external_surveyor_score `;

  let score_mapping_q = `
 select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
 where (case when B.updator_score is null then 0 else B.updator_score end ) >=0 
 `;

  let cond = "    and pm.role_id=4 ";
  if (usertype == 0) {
    cond = `  and pm.role_id=4 `;

    let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
    (select  ROUND(avg(newupdator_score),2) as chpupdatorscore,library_id from 
    (select *,avg(updator_score * 50) as newupdator_score from 
    ( select * from score_mapping where organization_id=${req.organization_id} ${datefilter} && updator_score >=0  && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id} 
      && user_id=${user_id} )  group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
    as libscore where library_id=${library_id} group by library_id`;
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

    if (fromDate && toDate) {
      datefilter = ` and DATE_FORMAT(createdAt,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    let sessionSubQuery = "";
    if (session_class_id && session_class_id != undefined) {
      sessionSubQuery = ` and substandard_id in (select id from sub_standards where session_class_id like'%${session_class_id}%' )`;
    }

    if (usertype == 1) {
      property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=5 ${sessionSubQuery}  && (status is null || status = 1 )  && user_id=${user_id}   group by substandard_id `;
      score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${datefilter} && internal_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
      fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
     (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) as internal_surveyor_score `;
      score_mapping_q = `
     select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
     where (case when B.internal_surveyor_score is null then 0 else B.internal_surveyor_score end ) >=0 
     `;

      // let sql = `select ROUND(avg(chpupdatorscore),2) as score  from
      // (select  ROUND(avg(newinternal_surveyor_score),2) as chpupdatorscore,library_id from
      // (select *,avg(internal_surveyor_score * 50) as newinternal_surveyor_score from
      // ( select * from score_mapping where organization_id=${req.organization_id} && internal_surveyor_score >=0
      //   && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id}
      //   && user_id=${user_id} ) ${sessionSubQuery}  group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
      // as libscore where library_id=${library_id} group by library_id`;
      // console.log(getLibraryScoreUpdator);

      let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
      (select  ROUND(avg(newinternal_surveyor_score),2) as chpupdatorscore,library_id from 
      (select *,avg(internal_surveyor_score * 50) as newinternal_surveyor_score from 
      ( ${score_mapping_q} ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
      as libscore where library_id=${library_id} group by library_id`;

      const libScore = await db.sequelize.query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (libScore.length > 0) {
        return libScore[0].score;
      }
    } else {
      property_mapping = ` select * from property_mapping where organization_id=${organization_id} && library_id=${library_id}  && role_id=5 ${sessionSubQuery}  && (status is null || status = 1 )  && user_id=${user_id}   group by substandard_id `;
      score_mapping = ` select * from score_mapping where organization_id=${organization_id} ${datefilter} && external_surveyor_score is not null && library_id=${library_id}  group by substanard_id order by id desc `;
      fields = ` B.id, A.library_id, A.organization_id, A.chapter_id, A.standard_id, A.substandard_id, B.updator_id, B.internal_surveyor_id, B.external_surveyor_id,
     (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) as external_surveyor_score `;
      score_mapping_q = `
     select ${fields} from (${property_mapping}) as A left join (${score_mapping}) as B on  A.substandard_id = B.substanard_id && A.standard_id=B.standard_id 
     where (case when B.external_surveyor_score is null then 0 else B.external_surveyor_score end ) >=0 
     `;

      // let sql = `select ROUND(avg(chpupdatorscore),2) as score  from
      // (select  ROUND(avg(newexternal_surveyor_score),2) as chpupdatorscore,library_id from
      // (select *,avg(external_surveyor_score * 50) as newexternal_surveyor_score from
      // ( select * from score_mapping where organization_id=${req.organization_id} && external_surveyor_score >=0  && substanard_id in (select substandard_id from property_mapping where organization_id=${req.organization_id}
      //   && user_id=${user_id} ) ${sessionSubQuery}   group by substanard_id order by substanard_id desc ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
      // as libscore where library_id=${library_id} group by library_id`;

      let sql = `select ROUND(avg(chpupdatorscore),2) as score  from 
      (select  ROUND(avg(newexternal_surveyor_score),2) as chpupdatorscore,library_id from 
      (select *,avg(external_surveyor_score * 50) as newexternal_surveyor_score from 
      ( ${score_mapping_q} ) as scorestd   group by standard_id order by standard_id) as scorechp group by chapter_id order by chapter_id)
      as libscore where library_id=${library_id} group by library_id`;

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
};

exports.getOverallLibraryScoreUpdatorById = async (
  req,
  user_id,
  surveyortype,
  organization_id = req.organization_id
) => {
  const assignedlibrary = await db.property_mapping.findAll({
    where: {
      user_id: user_id,
      organization_id: organization_id,
      role_id: 4,
    },
    group: ["library_id"],
  });

  let newscores = [];
  for (const element of assignedlibrary) {
    let score = await getLibraryScoreUpdatorById(
      req,
      element.library_id,
      user_id,
      (usertype = 0),
      organization_id
    );

    if (score) {
      // console.log("score...", score);
      newscores.push(+score);
    }
  }

  if (newscores.length > 0) {
    let avgScore = newscores.reduce((a, b) => a + b, 0) / newscores.length;
    return avgScore.toFixed(2);
  }
  return null;
};

exports.updateSuperAdminSubstandard = async (req) => {
  let org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  if (req.body.substandard_id.length > 0) {
    let substandard_ids = req.body.substandard_id.filter(
      (el) => el.mapping_id == null
    );

    substandard_ids = req.body.substandard_id.map((sub) => sub.id);

    let key = 0;
    for (const sub_id of substandard_ids) {
      if (sub_id != "" && sub_id != 0) {
        const finaldata = await db.sequelize.query(
          `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        var admin_activity_id_mapping = crypto
          .createHash("sha256")
          .update(
            req.body.name +
              "_" +
              finaldata[0].id +
              "_" +
              finaldata[0].standard_id +
              "_" +
              finaldata[0].chapter_id +
              "_" +
              finaldata[0].libraryId
          )
          .digest("hex");

        const countRes = await db.activity_mapping.findAll({
          where: {
            id: admin_activity_id_mapping,
            library_id: finaldata[0].library_id,
            chapter_id: finaldata[0].chapter_id,
            standard_id: finaldata[0].standard_id,
            substandard_id: finaldata[0].id,
          },
        });

        if (countRes.length == 0) {
          await db.activity_mapping.create({
            id: admin_activity_id_mapping,
            library_id: finaldata[0].library_id,
            chapter_id: finaldata[0].chapter_id,
            standard_id: finaldata[0].standard_id,
            substandard_id: finaldata[0].id,
            admin_activity_id: req.body.id,
            status: master.status.active,
            organization_id: org_id,
          });

          await auditCreate.create({
            user_id: req.userId,
            table_name: "admin_activities",
            primary_id: req.body.id,
            event: "update",
            new_value: req.body,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          });
          await auditCreate.create({
            user_id: req.userId,
            table_name: "activity_mapping",
            primary_id: req.body.id,
            event: "update",
            new_value: req.body,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          });
        }

        if (substandard_ids.length == key + 1) {
          return true;
        }
      } // if condition closed

      key++;
    }
  } else {
    return true;
  }
};

exports.compare = (a, b) => {
  if (a.sortItem < b.sortItem) {
    return -1;
  }
  if (a.sortItem > b.sortItem) {
    return 1;
  }
  return 0;
};

exports.checkSubstandardDeleteStatus = async (
  req,
  removesubstandard_uniq,
  role_id,
  user_id
) => {
  if (role_id == 4) {
    let arr = [];
    for (const element of removesubstandard_uniq) {
      let score = await db.sequelize.query(
        `select * from score_mapping where substanard_id='${element}' && updator_id=${user_id} && organization_id=${req.organization_id}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (score.length == 0) {
        arr.push(element);
      }
    }

    return arr;
  } else if (role_id == 5) {
    let arr = [];
    for (const element of removesubstandard_uniq) {
      let score = await db.sequelize.query(
        `select * from score_mapping where substanard_id=${element} && (internal_surveyor_id=${user_id} && external_surveyor_id=${user_id}) && organization_id=${req.organization_id}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (score.length == 0) {
        arr.push(element);
      }
    }

    return arr;
  }
};

exports.addPropertyNotificationUpdate = async (
  req,
  substanard_ids,
  user_id,
  typename
) => {
  let substandardName = null;
  let sessionname = [];
  let redirect_to = "/ss/accreditation";
  if (typename == "session") {
    for (const element of substanard_ids) {
      let session = await db.session_classes.findOne({
        where: {
          id: element,
        },
      });
      sessionname.push(session.class_name);
    }
    substandardName =
      sessionname.join(",") + ` session class has been assigned to you`;
    redirect_to = "/ss/Surveys";
  } else {
    let substandards = await db.sub_standards.findAll({
      where: {
        id: {
          [Op.in]: substanard_ids,
        },
      },
    });

    substanard_ids = substandards.map((el) => el.name);
    if (substanard_ids.length > 3) {
      substandardName = substanard_ids.slice(0, 3).join(", ");
      substandardName =
        substandardName +
        `+  ${substanard_ids.length - 3} substandards is added.`;
    } else {
      substandardName =
        substanard_ids.slice().join(", ") + ` substandards is added.`;
    }
  }

  await db.notifications.create({
    message: substandardName,
    user_id: user_id,
    redirect_to: redirect_to,
    createdBy: req.userId,
  });
};

exports.addPropertyNotification = async (
  req,
  substanard_ids,
  user_id,
  typename
) => {
  let substandardName = null;
  let sessionname = [];
  let redirect_to = "/ss/accreditation";
  if (typename == "session") {
    for (const element of substanard_ids) {
      let session = await db.session_classes.findOne({
        where: {
          id: element,
        },
      });
      sessionname.push(session.class_name);
    }
    substandardName =
      sessionname.join(",") + ` session class has been assigned to you`;
    redirect_to = "/ss/Surveys";
  } else {
    substanard_ids = substanard_ids.map((el) => el.name);
    if (substanard_ids.length > 3) {
      substandardName = substanard_ids.slice(0, 3).join(", ");
      substandardName =
        substandardName +
        `+  ${substanard_ids.length - 3} substandards is added.`;
    } else {
      substandardName =
        substanard_ids.slice().join(", ") + ` substandards is added.`;
    }
  }

  await db.notifications.create({
    message: substandardName,
    user_id: user_id,
    redirect_to: redirect_to,
    createdBy: req.userId,
  });
};

exports.addPropertyNotificationTemp = async (
  req,
  substanard_ids,
  user_id,
  typename
) => {
  let message = null;
  if (typename == "Chapters") {
    chapter_ids = substanard_ids.map((el) => el.name);

    if (chapter_ids.length > 3) {
      message = chapter_ids.slice(0, 3).join(", ");
      message = message + `+  ${chapter_ids.length - 3} chapters is added.`;
    } else {
      message = chapter_ids.slice().join(", ") + ` chapters is added.`;
    }
  } else if (typename == "Standard") {
    standard_ids = substanard_ids.map((el) => el.name);

    if (standard_ids.length > 3) {
      message = standard_ids.slice(0, 3).join(", ");
      message = message + `+  ${standard_ids.length - 3} Standards is added.`;
    } else {
      message = standard_ids.slice().join(", ") + ` Standards is added.`;
    }
  } else if (typename == "Substandard") {
    substanard_ids = substanard_ids.map((el) => el.name);

    if (substanard_ids.length > 3) {
      message = substanard_ids.slice(0, 3).join(", ");
      message =
        message + `+  ${substanard_ids.length - 3} substandards is added.`;
    } else {
      message = substanard_ids.slice().join(", ") + ` substandards is added.`;
    }
  } else {
    substanard_ids = substanard_ids.map((el) => el.name);
    if (substanard_ids.length > 3) {
      message = substanard_ids.slice(0, 3).join(", ");
      message =
        message + `+  ${substanard_ids.length - 3} substandards is added.`;
    } else {
      message = substanard_ids.slice().join(", ") + ` substandards is added.`;
    }
  }

  await db.notifications.create({
    message: message,
    user_id: user_id,
    redirect_to: "/ss/accreditation",
    createdBy: req.userId,
  });
};

exports.addNewSessionNotificationSurveyor = async (req, class_id, user_id) => {
  const session = await db.session_classes.findOne({
    where: {
      id: class_id,
    },
  });

  //  console.log(session);
  let message = ` Dear User, New ${session.class_name} session class has been created .`;
  await db.notifications.create({
    message: message,
    user_id: user_id,
    redirect_to: "/ss/Surveys",
    createdBy: req.userId,
  });
};

exports.AddNotificationSelfAssessment = async (req) => {
  const notifySubstandard = await db.sub_standards.findOne({
    where: {
      id: req.body.substanard_id,
    },
  });

  let clientAdmUser = await db.users.findOne({
    where: {
      organization_id: req.organization_id,
      role_id: {
        [Op.in]: [2, 3],
      },
    },
  });

  let viewers = await db.property_mapping.findAll({
    where: {
      substandard_id: req.body.substanard_id,
      organization_id: req.organization_id,
      role_id: 6,
    },
    group: "user_id",
  });
  let message = null;
  if (req.role_id == 4) {
    message = ` ${notifySubstandard.name} substandard assessment is added by updator.`;
  } else {
    message = ` ${notifySubstandard.name} substandard assessment is added by surveyor.`;
  }

  await db.notifications.create({
    message: message,
    redirect_to: "/ss/score",
    user_id: clientAdmUser.id,
    createdBy: req.userId,
  });

  for (const element of viewers) {
    await db.notifications.create({
      message: message,
      redirect_to: "/ss/score",
      user_id: element.user_id,
      createdBy: req.userId,
    });
  }
};

exports.getUpdatorAssignedActivity = async (req) => {
  let today = new Date();
  let fromDate =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  let toDate =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const sql = `select A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
  m.id,A.type,A.kpi,A.submission_day,A.response_frequency,A.id as admin_activity_id,m.client_activity_id,m.library_id,A.kpi_name,A.observation_name,A.document_name from activity_mapping m
left join admin_activities as A  on m.admin_activity_id=A.id and m.organization_id in (0,${req.organization_id})  
left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id}   && p.role_id=4 
where m.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} and status=1)  
&& p.user_id=${req.userId}    && m.admin_activity_id is not null group by A.code,m.library_id  
`;

  let adminActivities = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
    raw: true,
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

  const clientActivities = await db.sequelize.query(
    `select A.name as activity, A.code, A.submission_day, A.response_frequency,m.client_activity_id, m.admin_activity_id,
      m.id, A.type,A.kpi,A.submission_day, A.response_frequency, A.id as client_activity_id, m.admin_activity_id,m.library_id,
      A.kpi_name,A.observation_name,A.document_name from activity_mapping m
      left join client_admin_activities as A  on m.client_activity_id = A.id and m.organization_id in (${req.organization_id}) 
      left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id}    && p.role_id=4 
      where m.library_id in (select library_id from organization_libraries where organization_id = ${req.organization_id} and status = 1)  
      && p.user_id=${req.userId}   && m.client_activity_id is not null group by A.code, m.library_id  `,
    {
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (clientActivities.length > 0) {
    adminActivities = adminActivities.concat(clientActivities);
  }

  //   adminActivities = adminActivities.filter(el=>el.type==2 && el.kpi==1);
  // console.log(adminActivities.length);
  //   console.log(adminActivities);

  let i = 0;
  for (const activity of adminActivities) {
    if (adminActivities[i]) {
      adminActivities[i].status = "N/A";

      if (
        activity.type == 1 &&
        activity.response_frequency &&
        activity.submission_day
      ) {
        adminActivities[i].status = 0;

        let userCond = `&& substandard_id in (select substandard_id from activity_mapping as m left join
      organization_libraries as B on m.library_id = B.library_id where B.organization_id = ${req.organization_id} )`;

        if (req.role_id > 3) {
          userCond = `&& substandard_id in (select substandard_id from property_mapping  
                  where organization_id = ${req.organization_id} && user_id=${req.userId} && role_id=${req.role_id} )`;
        }
        let whereActivity = "";
        let responseHeadList = await exports.getStartAndEndDate(
          fromDate,
          toDate,
          activity.response_frequency,
          activity.submission_day
        );

        console.log("responseHeadList ", responseHeadList);

        adminActivities[i].upcomingExporyDate = responseHeadList.endDate;

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

        console.log(resultAct);

        if (resultAct[0].noofresponse > 0 && adminActivities[i]) {
          adminActivities[i].status = 1;
        }
      } else if (
        activity.type == 2 &&
        activity.response_frequency &&
        activity.submission_day
      ) {
        adminActivities[i].status = 0;
        let responseHeadList = await exports.getResponseHead(
          fromDate,
          toDate,
          activity.response_frequency,
          activity.submission_day
        );

        //console.log(responseHeadList);

        if (activity.kpi == 0) {
          let where = "";
          for (const responseHead of responseHeadList) {
            let firstDate = exports.dateFormatUSA(responseHead.responseDate);
            let secondDate = exports.dateFormatUSA(
              responseHead.responseEndDate
            );
            adminActivities[i].upcomingExporyDate =
              responseHead.responseEndDate;
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
              adminActivities[i].status = 1;
            }
          }
        } else {
          for (const responseHead of responseHeadList) {
            let firstDate = exports.dateFormatUSA(responseHead.responseDate);
            let secondDate = exports.dateFormatUSA(
              responseHead.responseEndDate
            );
            adminActivities[i].upcomingExporyDate = responseHead.secondDate;
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
              adminActivities[i].status = 1;
            }
          }
        }
      } else if (
        activity.type == 3 &&
        activity.response_frequency &&
        activity.submission_day
      ) {
        adminActivities[i].status = 0;
        let responseHeadList = await exports.getResponseHead(
          fromDate,
          toDate,
          activity.response_frequency,
          activity.submission_day
        );
        let where = "";
        for (const responseHead of responseHeadList) {
          let firstDate = exports.dateFormatUSA(responseHead.responseDate);
          let secondDate = exports.dateFormatUSA(responseHead.responseEndDate);
          adminActivities[i].upcomingExporyDate = responseHead.responseEndDate;
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
            adminActivities[i].status = 1;
          }
        }
      }
    }
    i++;
  }

  let pendingAct = adminActivities.filter((el) => el.status == 0);

  pendingAct = pendingAct.map((el) => {
    let name = el.activity;
    if (el.type == 3) {
      name = el.document_name;
    }
    if (el.type == 2 && el.kpi == 0) {
      name = el.observation_name;
    }
    if (el.type == 2 && el.kpi == 1) {
      name = el.kpi_name;
    }
    return { ...el, activity: name };
  });
  return pendingAct;
};

exports.checkLibraryToBeDeleteFromOrg = async (req, libEl) => {
  let propertyMapping = await db.sequelize.query(
    `select * from property_mapping where organization_id = ${req.body.id} and library_id=${libEl} and  (status is null or status=1)`,
    {
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (propertyMapping.length > 0) {
    return false;
  }
  return true;
};

exports.sortAlphanumeric = (arr) => {
  sortAlphanumericmanually(arr);
  sortAlphanumeric2(arr);
  const sorted = arr.sort((a, b) => {
    a = a.sortItem;
    b = b.sortItem;
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return sorted;
};

function sortAlphanumeric2(arr) {
  const sorted = arr.sort((a, b) => {
    a = a.sortItem;
    b = b.sortItem;
    return a.localeCompare(b, "en", {
      numeric: true,
    });
  });

  return sorted;
}

function sortAlphanumericmanually(arr) {
  let reA = /[^a-zA-Z]/g;
  let reN = /[^0-9]/g;

  const sortAlphaNum = (a, b) => {
    a = a.sortItem;
    b = b.sortItem;
    var aA = a.replace(reA, "");
    var bA = b.replace(reA, "");
    if (aA === bA) {
      var aN = parseInt(a.replace(reN, ""), 10);
      var bN = parseInt(b.replace(reN, ""), 10);
      return aN === bN ? 0 : aN > bN ? 1 : -1;
    } else {
      return aA > bA ? 1 : -1;
    }
  };

  return arr.sort(sortAlphaNum);
}

exports.arrayMatch = (arr1, arr2) => {
  let arr = [];
  for (var i in arr1) {
    if (arr2.indexOf(arr1[i]) !== -1) arr.push(arr1[i]);
  }
  return arr;
};

exports.MultiArrayMatch = (arrays) => {
  let result = arrays.shift().filter(function (v) {
    return arrays.every(function (a) {
      return a.indexOf(v) !== -1;
    });
  });

  return result;
};

exports.getKPIReportScore = (data) => {
  let mapdate = data.map((el) => {
    let date = new Date(el.responsedate);
    return {
      ...el,
      groupstr: date.getFullYear() + "_" + ("0" + date.getMonth()).slice(-2),
    };
  });

  let mapdatesum = mapdate.map((el) => {
    let groupstrFilter = mapdate.filter(
      (filEl) => filEl.groupstr === el.groupstr
    );
    let score =
      groupstrFilter.reduce((a, b) => +a + +b.score, 0) / groupstrFilter.length;

    return {
      ...el,
      score: score.toFixed(2),
    };
  });

  return mapdatesum;
};

exports.getChecklistScore = async (
  req,
  admin_activity_id,
  client_activity_id,
  organization_id,
  library_id
) => {
  // let cond = `  admin_activity_id='${admin_activity_id}'`;
  // if (client_activity_id) {
  //   cond = `  client_activity_id='${client_activity_id}'`;
  // }

  // let sql = `
  // select Round(avg(score),2) as score from (
  //   select  (select avg(
  //    case when response="Yes" then 100 when response="No" then 0
  //            else null end
  //   ) as sc  from storage_activity_checklist_elements where storage_id=A.id && (element_id in (select A.id from activity_elements as A inner join (select A.*,B.substandard_uid from activity_mapping as A inner join sub_standards as B on A.substandard_id=B.id  && A.organization_id in (0,${organization_id} ) and A.library_id=${library_id} and A.status !=2 and ${cond}
  //          group by substandard_id) as B on A.substandard_id=B.substandard_uid  where (A.organization_id is null or A.organization_id=${organization_id} )
  //          group by A.id)  ||  element_id in (select id from activity_elements  where ${cond} && substandard_id is null))  )  as score from storage_activity_checklist as A
  //   where organization_id=${organization_id} && ${cond}
  //   ) as A
  // `;


  console.log(admin_activity_id,'........................',client_activity_id);

  let today = new Date();
  let fromDate =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  let toDate =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

  let sql = "";
  let whereActivity = "";

  let adminActivity = null;
  if (admin_activity_id) {

    adminActivity = await db.activities_organization.findOne({
      where: {
        organization_id: organization_id,
        admin_activity_id: admin_activity_id,
       
      },
    });

 

    if (!adminActivity) {
      adminActivity = await db.admin_activities.findOne({
        where: {
        
          id: admin_activity_id,
        },
      });
    }
  } else {
    adminActivity = await db.client_admin_activities.findOne({
      where: {
        id: client_activity_id,
      },
    });
  }
  let responseHeadList = await exports.getStartAndEndDate(
    fromDate,
    toDate,
    adminActivity.response_frequency,
    fromDate
  );

  if (responseHeadList) {
    whereActivity = ` and response_date between date_format('${responseHeadList.startDate}','%Y-%m-%d') and date_format('${responseHeadList.endDate}','%Y-%m-%d')`;
  }

  if (admin_activity_id) {
    sql = `select  
      (select avg(score) from storage_activity_checklist where admin_activity_id = '${admin_activity_id}' && organization_id=${organization_id} ${whereActivity} ) as score
        from property_mapping limit 1`;
  } else {
    sql =  `select   
    (select avg(score) from storage_activity_checklist where client_activity_id = '${client_activity_id}' && organization_id=${organization_id}  ${whereActivity} ) as score
        from property_mapping limit 1`;
  } 

  const finalScore = await db.sequelize.query(sql, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  return finalScore[0].score;
};

exports.sortByDate = (array) => {
  let arr = array.sort(function (a, b) {
    return new Date(a.date) - new Date(b.date);
  });

  return arr;
};

exports.updatorActivityReportActivityStatus = async (
  req,
  activityList,
  updator_id,
  fromDate,
  toDate
) => {
  let incmpAct = 0;
  let compAct = 0;
  for (const element of activityList) {
    let activity = null;
    let organization_id = req.headers["organization"];
    let activityCond = "";
    if (element.admin_activity_id) {
      activityCond = `admin_activity_id='${element.admin_activity_id}'`;
      activity = await db.activities_organization.findOne({
        where: {
          admin_activity_id: element.admin_activity_id,
          organization_id: req.headers["organization"],
        },
        raw: true,
      });

      if (!activity) {
        activity = await db.admin_activities.findOne({
          where: {
            id: element.admin_activity_id,
          },
          raw: true,
        });
      }
    } else {
      activityCond = `client_activity_id='${element.client_activity_id}'`;
      activity = await db.client_admin_activities.findOne({
        where: {
          id: element.client_activity_id,
          organization_id: req.headers["organization"],
        },
        raw: true,
      });
    }

    if (activity.response_frequency && activity.submission_day) {
      let responseHeadList = await exports.getResponseHead(
        fromDate,
        toDate,
        activity.response_frequency,
        activity.submission_day
      );
      if (responseHeadList.length > 0) {
        let startDate = responseHeadList[0].responseDate;
        let endDate =
          responseHeadList[responseHeadList.length - 1].responseEndDate;

        let sql = null;

        if (activity.type == 1) {
          sql = `select count(*) as scr from storage_activity_checklist where organization_id=${organization_id} and ${activityCond} and response_date between '${startDate}' and '${endDate}'  group by response_date`;
        } else if (activity.type == 2 && activity.kpi == 1) {
          sql = `select count(*) as scr  from storage_activity_kpi as A inner join storage_activity_kpi_elements as B on A.id=B.storage_id where organization_id=${organization_id} and ${activityCond} and responsedate between '${startDate}' and '${endDate}'  group by responsedate,admin_activity_id,client_activity_id`;
        } else if (activity.type == 2 && activity.kpi == 2) {
          sql = `select count(*) as scr  from storage_observation where organization_id=${organization_id} and ${activityCond} and responsedate between '${startDate}' and '${endDate}'  group by responsedate`;
        } else {
          sql = `select count(*) as scr  from storage_activity_document where organization_id=${organization_id} and ${activityCond} and responsedate between '${startDate}' and '${endDate}' group by responsedate`;
        }

        let checkCount = await db.sequelize.query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        });

        if (checkCount) {
          if (
            checkCount.length > 0 &&
            checkCount[0].scr < responseHeadList.length
          ) {
            // console.log(responseHeadList);
            // console.log(activity.name);
            incmpAct++;
          } else {
            compAct++;
          }
        }
      }
    }
  }

  return { incmpAct, compAct };
};

dataFilterBetweenDate = (product_data, key, givenStartDate, givenEndDate) => {
  let startDate = new Date(givenStartDate);
  let endDate = new Date(givenEndDate);

  let resultProductData = product_data.filter((a) => {
    let date = new Date(a[key]);
    return date >= startDate && date <= endDate;
  });

  return resultProductData;
};

exports.getYTDKPIReport = async (
  req,
  scores,
  response_frequency,
  aggregation_type
) => {
  let avgYtdScore = 0;
  let avgYtdValue = 0;
  let fromDate = req.query.fromDate;
  let toDate = req.query.toDate;

  if (response_frequency == "Weekly") {
    if (!fromDate && !toDate) {
      let today = new Date();
      let startDate = formatDate(today.getFullYear() + "-" + "01-01");
      let lastDayOfMonth = endOfMonth(today);
      // lastDayOfMonth =  formatDate(lastDayOfMonth.getFullYear() + "-" + (lastDayOfMonth.getMonth()+1) + "-" + lastDayOfMonth.getDate() );
      scores = dataFilterBetweenDate(
        scores,
        "responsedate",
        startDate,
        lastDayOfMonth
      );
    } else {
      let today = new Date(fromDate);
      let startDate = formatDate(
        today.getFullYear() +
          "-" +
          (today.getMonth() + 1) +
          "-" +
          today.getDate()
      );
      let lastDayOfMonth = endOfMonth(new Date(toDate));
      // lastDayOfMonth =  formatDate(lastDayOfMonth.getFullYear() + "-" + (lastDayOfMonth.getMonth()+1) + "-" + lastDayOfMonth.getDate() );
      scores = dataFilterBetweenDate(
        scores,
        "responsedate",
        startDate,
        lastDayOfMonth
      );
    }
  } else {
    let today = new Date();
    let startDate = formatDate(today.getFullYear() + "-" + "01-01");
    let lastDayOfMonth = endOfMonth(today);

    if (!fromDate && !toDate) {
      today = new Date();
      startDate = formatDate(today.getFullYear() + "-" + "01-01");
      lastDayOfMonth = endOfMonth(today);
      // lastDayOfMonth =  formatDate(lastDayOfMonth.getFullYear() + "-" + (lastDayOfMonth.getMonth()+1) + "-" + lastDayOfMonth.getDate() );
      // scores = dataFilterBetweenDate(scores,"responsedate",startDate,lastDayOfMonth);
    } else {
      today = new Date(fromDate);
      startDate = formatDate(
        today.getFullYear() +
          "-" +
          (today.getMonth() + 1) +
          "-" +
          today.getDate()
      );
      lastDayOfMonth = endOfMonth(new Date(toDate));
      // lastDayOfMonth =  formatDate(lastDayOfMonth.getFullYear() + "-" + (lastDayOfMonth.getMonth()+1) + "-" + lastDayOfMonth.getDate() );
      // scores = dataFilterBetweenDate(scores,"responsedate",startDate,lastDayOfMonth);
    }

    let responseHeadList = await exports.getStartAndEndDate(
      startDate,
      lastDayOfMonth,
      response_frequency,
      startDate
    );
    scores = dataFilterBetweenDate(
      scores,
      "responsedate",
      responseHeadList.startDate,
      responseHeadList.endDate
    );
  }

  avgYtdScore = scores.reduce((a, b) => +a + +b.score, 0) / scores.length;

  if (aggregation_type == "Sum") {
    if (response_frequency == "Weekly") {
      avgYtdValue =
        scores.reduce((a, b) => +a + +b.actual_value, 0) / scores.length;
    } else {
      avgYtdValue = scores.reduce((a, b) => +a + +b.actual_value, 0);
    }
  } else {
    avgYtdValue =
      scores.reduce((a, b) => +a + +b.actual_value, 0) / scores.length;
  }

  return { avgYtdScore, avgYtdValue };
};
