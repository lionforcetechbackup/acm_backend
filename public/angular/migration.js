var app = angular.module("myApp", ["ui-notification"]);

app.config(function(NotificationProvider) {
  NotificationProvider.setOptions({
      delay: 5000,
      startTop: 20,
      startRight: 10,
      verticalSpacing: 200,
      horizontalSpacing: 400,
      positionX: "right",
      positionY: "top"
  });
});
app.controller("MigrationController", function($scope,Notification, $http, $timeout) {
  console.log("MigrationController");

  $scope.datatypes = [{ name: "integer(11)", value: "integer" }, { name: "bigInteger(20)", value: "bigInteger" }, 
  { name: "tinyInteger(4)", value: "tinyInteger" }, { name: "smallInteger(6)", value: "smallInteger" },
  { name: "string(191)", value: "string" }, { name: "string(255)", value: "full_length_string" }, { name: "text", value: "text" },
  { name: "date", value: "date" }, { name: "time", value: "time" }, { name: "dateTime", value: "dateTime" },
      { name: "decimal", value: "decimal" }, { name: "boolean", value: "boolean" }, { name: "year(4)", value: "year" },
  // { name: "Json value", value: "text_json" }
];
  $scope.table = {
    table_name: "",
    form_type: "create",
    table_field: [
      {
        Field: "",
        Type: "",
        Null: "YES",
        Key: "",
        Default: "",
        Extra: ""
      }
    ]
  };

  $scope.add_new_field_up = function(index) {
    $scope.table.table_field.splice(index,-1, {
      Field: "",
      Type: "",
      Null: "YES",
      Key: "",
      Default: "",
      Extra: ""
    });
  };
  $scope.add_new_field_down = function(index) {
    $scope.table.table_field.splice(index + 1, 0, {
      Field: "",
      Type: "",
      Null: "YES",
      Key: "",
      Default: "",
      Extra: ""
    });
  };

  $scope.reMove = function(index) {
    $scope.table.table_field.splice(index, 1);
  };

  $scope.form_store = function(table) {
    console.log(table);
    var param = {
      table_name: "Table"
    };
    // $http.post("/insert", table).then(function(res) {});
    $http({
      method: "POST",
      url: "/db/migration-insert",
      data: table
    }).then(function(result) {
      Notification.success(result.data.status);

      console.log(result.config.data.table_name);
      // $scope.message = result.data;
      $scope.get_migration();
      $scope.show_root=true;
      $scope.bindvalue=`const `+result.config.data.table_name+`Controller = require('../controller/`+result.config.data.table_name+`.controller.js');
                        app.post('/api/`+result.config.data.table_name+`/create',`+result.config.data.table_name+`Controller.create)
                        app.post('/api/`+result.config.data.table_name+`/update',`+result.config.data.table_name+`Controller.update)
                        app.get('/api/`+result.config.data.table_name+`/get',`+result.config.data.table_name+`Controller.get)
                        app.get('/api/`+result.config.data.table_name+`/getById/:id',`+result.config.data.table_name+`Controller.getById)
                        app.delete('/api/`+result.config.data.table_name+`/delete/:id',`+result.config.data.table_name+`Controller.delete)
                        app.get('/api/`+result.config.data.table_name+`/statusChange/:id/:status',`+result.config.data.table_name+`Controller.statusChange)`;
      if (result.data.status == 200) {
       
        $scope.table = {
          table_name: "",
          form_type: "create",
          table_field: [
            {
              Field: "",
              Type: "",
              Null: "YES",
              Key: "",
              Default: "",
              Extra: ""
            }
          ]
        };
      }
      $timeout(() => {
        $scope.message = "";
      }, 3000);
    });
  };

  $scope.alter_table_colums = function(d) {
    $http({
      method: "POST",
      url: "/db/table_json_file",
      data: { table_name: d }
    }).then(function(result) {
      console.log(result);
      // if (result.data.status != "error") {
        // $scope.table.table_field = result.data.result;
        $scope.table = result.data;
        $scope.table.form_type = "alter";
      // } else {
      //   $scope.table = {
      //     table_name: "",
      //     form_type: "create",
      //     table_field: [
      //       {
      //         Field: "",
      //         Type: "",
      //         Null: "YES",
      //         Key: "",
      //         Default: "",
      //         Extra: ""
      //       }
      //     ]
      //   };
      // }
    });
  };

  $scope.show_table_drop = function(d) {
    $http({
      method: "POST",
      url: "/db/show-table-drop",
      data: { table_name: d }
    }).then(function(result) {
      // console.log(result);
            $scope.message = result.data;
            $scope.get_migration();
     $timeout(() => {
       $scope.message = "";
     }, 3000);
    });
  };

  $scope.get_migration = function() {
    $http({
      method: "GET",
      url: "/db/table_json_file"
    }).then(function(result) {
      // console.log(result);
      $scope.show_table = result.data;
      console.log($scope.show_table);
    });
  };
  $scope.get_migration();

  $http({
    method: "GET",
    url: "/db/show-table-list"
  }).then(function(result) {
    // console.log(result);
    $scope.show_db = "Tables_in_" + Object.values(result.data.result[0])[0];
    console.log($scope.show_db);
  });
});
