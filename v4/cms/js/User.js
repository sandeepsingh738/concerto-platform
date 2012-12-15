/*
Concerto Platform - Online Adaptive Testing Platform
Copyright (C) 2011-2012, The Psychometrics Centre, Cambridge University

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; version 2
of the License, and not any of the later versions.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

function User() { };
OModule.inheritance(User);

User.className="User";
User.sessionID="";
User.reloadOnModification=true;
User.reloadHash="tnd_mainMenu-users";

User.onBeforeSave=function(isNew){
    if(isNew==null) isNew = false;
    Methods.confirmUnsavedLost(function(){
        User.uiSave(true,isNew);
    });
}

User.onBeforeDelete=function(oid){
    Methods.confirmUnsavedLost(function(){
        User.uiDelete(oid,true);
    });
}

User.crudShareDeleted = [];
User.crudShareUpdated = [];
User.onAfterEdit=function() {
    User.crudShareDeleted = [];
    User.crudShareUpdated = [];
};

User.onAfterChangeListLength=function(){
    };

User.onAfterList=function(){
    }

User.getAddSaveObject=function()
{
    var login = $("#form"+this.className+"InputLogin").val();
    var password = $("#form"+this.className+"InputPassword").val();
    var hash = User.getClientHash(login, password);
    
    return { 
        oid:this.currentID,
        class_name:this.className,
        login:login,
        firstname:$("#form"+this.className+"InputFirstname").val(),
        lastname:$("#form"+this.className+"InputLastname").val(),
        email:$("#form"+this.className+"InputEmail").val(),
        phone:$("#form"+this.className+"InputPhone").val(),
        UserInstitutionType_id:$("#form"+this.className+"SelectInstitutionType").val(),
        institution_name:$("#form"+this.className+"InputInstitutionName").val(),
        modify_password:$("#form"+this.className+"CheckboxPassword").is(":checked")?1:0,
        superuser:$("#form"+this.className+"CheckboxSuperuser").length==1&&$("#form"+this.className+"CheckboxSuperuser").is(":checked")?1:0,
        password_hash:hash
    };
};

User.getFullSaveObject=function()
{
    var obj = this.getAddSaveObject();
    obj["deleteShare"] = User.getSerializedCrudDeleted();
    obj["updateShare"] = User.getSerializedCrudUpdated();
    return obj;
}

User.getSerializedCrudDeleted=function(){
    return $.toJSON(User.crudShareDeleted);
}

User.getSerializedCrudUpdated=function(){
    var grid = $("#div"+this.className+"GridShare").data('kendoGrid');
    var shares = new Array();
    if(grid!=null) {
        var data = grid.dataSource.data();
    
        for(var i=0;i<data.length;i++){
            if(User.crudShareUpdated.indexOf(data[i].id)!=-1 || data[i].id==0){
                shares.push({
                    id:data[i].id,
                    invitee_id:data[i].invitee_id
                });
            }
        }
    }
    return $.toJSON(shares);
      
}

User.getShares=function(){
    var grid = $("#div"+this.className+"GridShare").data('kendoGrid');
    var shares = new Array();
    if(grid==null) return shares;
    var data = grid.dataSource.data();
    
    for(var i=0;i<data.length;i++){
        shares.push({
            invitee_id:data[i].invitee_id
        });
    }
    return shares;
}

User.uiEditShare=function(obj){
    var thisClass = this;
    
    var shareGrid = $("#div"+thisClass.className+"GridShare").data('kendoGrid');
    var index = obj.closest('tr')[0].sectionRowIndex;
    var item = shareGrid.dataItem(shareGrid.tbody.find("tr:eq("+index+")"));
    
    $.post("view/User_grant.php",{
        oid:this.currentID,
        current_invitee_id:item.invitee_id,
        shares:$.toJSON(User.getShares())
    },function(data){
        $("#div"+thisClass.className+"ShareDialog").html(data);
        
        $("#div"+thisClass.className+"ShareDialog").dialog({
            title:dictionary["s651"],
            resizable:false,
            modal:true,
            width:400,
            open:function(){
                $('.ui-widget-overlay').css('position', 'fixed');  
            },
            close:function(){
                //$('.ui-widget-overlay').css('position', 'absolute');
                $(this).dialog("destroy");
            },
            buttons:[
            {
                text:dictionary["s38"],
                click:function(){
                    if($("#select"+thisClass.className+"InviteeShareDialog").val()==0){
                        Methods.alert(dictionary["s652"], "alert", dictionary["s651"]);
                        return;
                    }
                    if(item.id!=0){
                        User.crudUpdate("shares", item.id);
                    }
                    
                    var rowIndex = shareGrid.dataSource.data()[index];
                    rowIndex["invitee_id"]=$("#select"+thisClass.className+"InviteeShareDialog").val();
                    rowIndex["name"]=$("#select"+thisClass.className+"InviteeShareDialog").children("option[selected='selected']").attr("name");
                    rowIndex["institution"]=$("#select"+thisClass.className+"InviteeShareDialog").children("option[selected='selected']").attr("institution");
                    User.uiRefreshShareGrid();
                
                    $(this).dialog("close");
                
                    Methods.iniTooltips();
                }
            },
            {
                text:dictionary["s23"],
                click:function(){
                    $(this).dialog("close");
                }
            }
            ]
        });
    });
}

User.uiRemoveShare=function(obj){
    var thisClass = this;
    Methods.confirm(dictionary["s653"], dictionary["s654"], function(){
        var grid = $("#div"+thisClass.className+"GridShare").data('kendoGrid');
        var index = obj.closest('tr')[0].sectionRowIndex;
        var item = grid.dataItem(grid.tbody.find("tr:eq("+index+")"));
        
        if(item.id!=""){
            User.crudUpdate(User.crudShareDeleted, item.id);
        }
        
        grid.removeRow(grid.tbody.find("tr:eq("+index+")"));
    });
}

User.uiAddShare=function(){
    var thisClass = this;
    
    $.post("view/User_grant.php",{
        oid:this.currentID,
        current_invitee_id:0,
        shares:$.toJSON(User.getShares())
    },function(data){
        $("#div"+thisClass.className+"ShareDialog").html(data);
        
        $("#div"+thisClass.className+"ShareDialog").dialog({
            title:dictionary["s647"],
            resizable:false,
            modal:true,
            width:400,
            open:function(){
                $('.ui-widget-overlay').css('position', 'fixed');  
            },
            close:function(){
                //$('.ui-widget-overlay').css('position', 'absolute');
                $(this).dialog("destroy");
            },
            buttons:[
            {
                text:dictionary["s37"],
                click:function(){
                    if($("#select"+thisClass.className+"InviteeShareDialog").val()==0){
                        Methods.alert(dictionary["s652"], "alert", dictionary["s647"]);
                        return;
                    }
                    var shareGrid = $("#div"+thisClass.className+"GridShare").data('kendoGrid');
                    shareGrid.dataSource.add({
                        invitee_id:$("#select"+thisClass.className+"InviteeShareDialog").val(),
                        name:$("#select"+thisClass.className+"InviteeShareDialog").children("option[selected='selected']").attr("name"),
                        institution:$("#select"+thisClass.className+"InviteeShareDialog").children("option[selected='selected']").attr("institution")
                    })
                
                    $(this).dialog("close");
                
                    Methods.iniTooltips();
                }
            },
            {
                text:dictionary["s23"],
                click:function(){
                    $(this).dialog("close");
                }
            }
            ]
        });
    });
}

User.shareGridSchemaFields = null;
User.uiReloadShareGrid=function(data,columns){
    var thisClass = this;
    
    $("#div"+this.className+"GridShareContainer").html("<div id='div"+this.className+"GridShare' class='grid'></div>");
        
    var dataSource = new kendo.data.DataSource({
        data:data,
        schema:{
            model:{
                fields:User.shareGridSchemaFields
            }
        }
    });
    
    $("#div"+thisClass.className+"GridShare").kendoGrid({
        dataBound:function(e){
            Methods.iniTooltips();  
        },
        dataSource: dataSource,
        columns: columns,
        toolbar:[
        {
            name: "create", 
            template: '<button class="btnAdd" onclick="Table.uiAddShare()">'+dictionary["s37"]+'</button>'
        }
        ],
        editable: false,
        scrollable:false
    });
    Methods.iniIconButton(".btnAdd", "plus");
}

User.uiRefreshShareGrid=function(){
    var grid = $("#div"+this.className+"GridShare").data('kendoGrid');
    
    var columns = grid.columns;
    var items = grid.dataSource.data();
    
    User.uiReloadShareGrid(items, columns);
}

User.uiIniShareGrid=function(){
    var thisClass = this;
    
    $("#div"+this.className+"GridShareContainer").html("<div id='div"+this.className+"GridShare' class='grid'></div>");
    
    var fields = {
        id:{
            type:"number"
        },
        invitee_id:{
            type:"number"
        },
        name:{
            type:"string"
        },
        institution:{
            type:"string"
        }
    };
    
    var dataSource = new kendo.data.DataSource({
        transport:{
            read: {
                url:"query/User_share_list.php?oid="+thisClass.currentID,
                dataType:"json"
            }
        },
        schema:{
            model:{
                id:"id",
                fields:fields
            }
        }
    });
    
    User.shareGridSchemaFields = fields;
    
    $("#div"+this.className+"GridShare").kendoGrid({
        dataBound:function(e){
            Methods.iniTooltips();  
        },
        dataSource: dataSource,
        columns: [{
            title:dictionary["s69"],
            field:"invitee_id"
        },{
            title:dictionary["s70"],
            field:"name"
        },{
            title:dictionary["s421"],
            field:"institution"
        },{
            title:' ',
            width:50,
            template:'<span style="display:inline-block;" class="spanIcon tooltip ui-icon ui-icon-pencil" onclick="'+thisClass.className+'.uiEditShare($(this))" title="'+dictionary["s644"]+'"></span>'+
            '<span style="display:inline-block;" class="spanIcon tooltip ui-icon ui-icon-trash" onclick="'+thisClass.className+'.uiRemoveShare($(this))" title="'+dictionary["s645"]+'"></span>'
        }],
        toolbar:[
        {
            name: "create", 
            template: '<button class="btnAdd" onclick="'+thisClass.className+'.uiAddShare()">'+dictionary["s646"]+'</button>'
        }
        ],
        editable: false,
        scrollable:true
    });
    Methods.iniIconButton(".btnAdd", "plus");
}

User.previousWorkspace = null;
User.uiChangeWorkspace=function(obj){
    var thisClass = this;
    var obj = $(obj);
    var newWorkspace = obj.val();
    
    Methods.confirmUnsavedLost(function(){
        $.post("query/change_workspace.php",{
            workspace:newWorkspace
        },function(data){
            switch(data.result){
                case OModule.queryResults.OK:{
                    obj.val(newWorkspace);
                    Methods.alert(dictionary["s631"], "info", dictionary["s630"], function(){
                        Methods.uiBlockAll();
                        Methods.reload(thisClass.reloadHash);
                    });
                    break;
                }
                case OModule.queryResults.notLoggedIn:{
                    thisClass.onNotLoggedIn(dictionary["s630"]);
                    break;     
                }
                case OModule.queryResults.accessDenied:{
                    Methods.alert(dictionary["s81"], "alert", dictionary["s630"]);
                    break;
                }
            }
        },"json");
    });
    obj.val(User.previousWorkspace);
}

User.uiSaveValidate=function(ignoreOnBefore,isNew){
    var thisClass = this;
    if(!this.checkRequiredFields([
        $("#form"+this.className+"InputLogin").val(),
        $("#form"+this.className+"InputFirstname").val(),
        $("#form"+this.className+"InputLastname").val(),
        $("#form"+this.className+"InputEmail").val(),
        $("#form"+this.className+"SelectInstitutionType").val(),
        $("#form"+this.className+"InputInstitutionName").val()
        ])) {
        Methods.alert(dictionary["s415"],"alert");
        return false;
    }
    
    if($("#form"+this.className+"CheckboxPassword").is(":checked")&&$("#form"+this.className+"InputPassword").val()!=$("#form"+this.className+"InputPasswordConf").val())
    {
        Methods.alert(dictionary["s66"],"alert");
        return false;
    }
    
    $.post("query/check_module_unique_fields.php", {
        "class_name":this.className,
        "oid":this.currentID,
        "fields[]":[$.toJSON({
            name:"login",
            value:$("#form"+this.className+"InputLogin").val()
        })]
    },function(data){
        switch(data.result){
            case OModule.queryResults.OK: {
                User.uiSaveValidated(ignoreOnBefore,isNew);
                break;
            }
            case 1:{
                Methods.alert(dictionary["s336"],"alert",dictionary["s274"]);
                break;   
            }
            case OModule.queryResults.notLoggedIn:{
                thisClass.onNotLoggedIn(dictionary["s274"]);
                break;
            }
        }
    },"json");
}

User.register = function(){
    var thisClass = this;
    
    var login = $("#dd_register_inp_login").val();
    var firstname = $("#dd_register_inp_first_name").val();
    var lastname = $("#dd_register_inp_last_name").val();
    var email = $("#dd_register_inp_last_email").val();
    var phone = $("#dd_register_inp_last_phone").val();
    var password = $("#dd_register_inp_password").val();
    var password_conf = $("#dd_register_inp_password_conf").val();
    var institution_type = $("#dd_register_select_institution_type").val();
    var institution_name = $("#dd_register_inp_institution_name").val();
    
    if(!this.checkRequiredFields([
        login,firstname,lastname,email,institution_type,institution_name
        ])) {
        Methods.alert(dictionary["s415"],"alert");
        return;
    }
    
    if(password!=password_conf)
    {
        Methods.alert(dictionary["s66"],"alert",dictionary["s410"]);
        return false;
    }
    
    $.post("query/check_module_unique_fields.php", {
        "class_name":this.className,
        "oid":0,
        "fields[]":[$.toJSON({
            name:"login",
            value:login
        })]
    },function(data){
        switch(data.result){
            case OModule.queryResults.OK: {
                var hash = User.getClientHash(login,password);
                $.post("query/register.php",{
                    login:login,
                    password_hash:hash,
                    firstname:firstname,
                    lastname:lastname,
                    email:email,
                    phone:phone,
                    UserInstitutionType_id:institution_type,
                    institution_name:institution_name
                },function(data){
                    switch(data.result){
                        case 0:{
                            Methods.alert(dictionary["s414"], "alert", dictionary["s410"],function(){
                                location.href='index.php';
                            });
                            break;
                        }
                        case OModule.queryResults.accessDenied:{
                            Methods.alert(dictionary["s81"], "alert", dictionary["s410"]);
                            break;
                        }
                    }
                },"json");
                
                break;
            }
            case 1:{
                Methods.alert(dictionary["s336"],"alert",dictionary["s410"]);
                return;    
            }
            case OModule.queryResults.notLoggedIn:{
                thisClass.onNotLoggedIn(dictionary["s410"]);
                return;
            }
        }
    },"json");
}

User.uiPasswordRecovery=function(){
    var login = $("#dd_login_inp_login").val();
    if(!this.checkRequiredFields([
        login
        ])) {
        Methods.alert(dictionary["s415"],"alert");
        return;
    }
    
    $.post("query/recover_password.php",{
        login:login
    },function(data){
        switch(data.result){
            case OModule.queryResults.OK:{
                Methods.alert(dictionary["s432"],"info",dictionary["s427"]);
                break;
            }
            case -1:{
                Methods.alert(dictionary["s426"],"alert",dictionary["s427"]);
                break;
            }
        }
    },"json");
}

User.uiRegister=function(){
    $("#dd_login").dialog("close");
    $("#dd_register").dialog({
        modal:true,
        width:400,
        title:dictionary["s410"],
        resizeable:false,
        closeOnEscape:false,
        dialogClass:"no-close",
        open:function(){
            $('.ui-widget-overlay').css('position', 'fixed');
            Methods.iniTooltips();
        },
        close:function(){
        //$('.ui-widget-overlay').css('position', 'absolute');
        },
        buttons:[
        {
            text:dictionary["s412"],
            click:function(){
                User.register();
            }
        },
        {
            text:dictionary["s23"],
            click:function(){
                location.href = "index.php";
            }
        }
        ]
    });
}

User.getClientHash = function(login,password){
    var hash = password;
    for(var i=0;i<5000;i++){
        var shaObj = new jsSHA(login+"-"+hash, "ASCII");
        hash = shaObj.getHash("SHA-512", "HEX");
    }
    return hash;
}

User.uiLogIn=function()
{
    var thisClass=this;
    
    if(!this.checkRequiredFields([
        $("#dd_login_inp_login").val()
        ])) {
        Methods.alert(dictionary["s415"],"alert");
        return;
    }
    
    var login = $("#dd_login_inp_login").val();
    var password = $("#dd_login_inp_password").val();
    var hash = User.getClientHash(login,password);
    
    Methods.uiBlock($("#dd_login").parent());
    $.post("query/log_in.php",
    {
        login:login,
        password:hash
    },
    function(data){
        Methods.uiUnblock($("#dd_login").parent());
        if(data.success==1)
        {
            $("#dd_login").dialog("close");
            Methods.uiBlockAll();
            $.post("view/layout.php",{},
                function(data){
                    Methods.uiUnblockAll();
                    $("#content").html(data);
                });
        }
        else Methods.alert(dictionary["s67"],"alert");
    },"json");
};

User.uiLogOut=function()
{
    Methods.uiBlockAll();
    $.post("query/log_out.php",{},
        function(data){
            location.href="index.php";
        });
};

User.sessionKeepAlive=function(interval){
    setTimeout(function(){
        $.post("query/session_keep_alive.php",{},function(data){
            User.sessionKeepAlive(interval);
        });
    },interval);
}