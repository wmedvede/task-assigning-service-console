const TASK_ASSIGNING_SERVICE_SOLUTION_URL = "http://localhost:8383/task-assigning/service/solution";

const skillToColorMap = new Map([
    ['EN', '#edd400'],
    ['ES', '#ef2929'],
    ['DE', '#e9b96e'],
    ['javascript', '#ad7fa8'],
    ['java', '#729fcf'],
    ['ada', '#73d216']
]);

const groupToColorMap = new Map([
    ['managers', '#edd400'],
    ['interns', '#ef2929'],
    ['employees', '#e9b96e'],
    ['Car insurance', '#ad7fa8'],
    ['Property insurance', '#729fcf'],
    ['Life insurance', '#73d216']
]);

const pinnedTaskColor = '#ebfadc';
const waitingTaskColor = 'White';

var autoRefreshIntervalId = null;
var periodicRefreshStarted = false;

const fetchHeaders = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
};

function refreshSolution() {
    $.getJSON(TASK_ASSIGNING_SERVICE_SOLUTION_URL, (taskAssigningSolution) => {
        printSolutionTable(taskAssigningSolution);
    })
            .fail(function (jqxhr, textStatus, error) {
                const err = "Internal error: " + textStatus + ", " + error;
                showError("An error was produced during solution refresh. Please check if the Task Assigning Service is started",
                        err);
            });
}

function printSolutionTable(taskAssigningSolution) {
    const solutionTable = $('#solutionTable');
    solutionTable.children().remove();

    const tableBody = $('<tbody>').appendTo(solutionTable);
    taskAssigningSolution.userList.forEach((user) => {
        printUser(tableBody, user);
    });
}

function printUser(tableBody, user) {
    const tableRow = $('<tr class="agent-row">').appendTo(tableBody);
    const td = $('<td>').appendTo(tableRow);
    const userCard = $('<div class="card" style="background-color:#f7ecd5">').appendTo(td);
    const userCardBody = $('<div class="card-body p-1">').appendTo(userCard);
    const userCardRow = $(`<div class="row flex-nowrap">
                <div class="col-1">
                    <i class="fas fa-user-alt"></i>
                </div>
                <div class="col-11">
                    <span style="font-size:1.2em">${user.id}</span>
                </div>
        </div>`).appendTo(userCardBody);

    const userGroups = new Array();
    //user.group is a json array in the format -> [{id = "manager", user = false}, {id = "employees", user = false}]
    //collect the id.
    user.groups.forEach(group => {
        userGroups.push(group.id)
    });

    //always a string array in the format -> ["skill1", "skill2", "skill3"]
    const userSkills = user.attributes["SKILLS"];

    $("<hr style='margin-top: 0px;margin-bottom: 0px;'>").appendTo(userCardBody);
    printGroups(userCardBody, userGroups)
    $("<hr style='margin-top: 0px;margin-bottom: 0px;'>").appendTo(userCardBody);
    printSkills(userCardBody, userSkills);

    const tasksTd = $('<td style="flex-flow:row; display: flex;">').appendTo(tableRow);

    //collect the user tasks from the chained model.
    const userTasks = new Array();
    var next = user.nextElement;
    while (next != null) {
        userTasks.push(next);
        next = next.nextElement;
    }
    userTasks.forEach(task => {
        printTask(tasksTd, task)
    });
}

function printTask(callsTd, taskAssignment) {
    //trim original task id in the format "5cffa1a2-d907-4b2e-9291-370a66dd41ca"  to "5cffa1a2"
    const taskId = taskAssignment.id.substring(0, 8)
    const taskColor = (taskAssignment.pinned) ? pinnedTaskColor : waitingTaskColor;
    const taskCard = $(`<div class="card" style="float:left; background-color: ${taskColor}"/>`).appendTo(callsTd);
    const pinIcon = (taskAssignment.pinned) ? '<i class="fas fa-thumbtack"></i>' : '';

    const taskCardContainer = $('<div class="card-body">').appendTo(taskCard);
    taskCardContainer.append($(`<h5 class="card-title" style="padding-right:0px">${taskId}</h5>`));
    taskCardContainer.append($(`<h5 class="card-title" style="padding-right:0px">${taskAssignment.task.name}</h5>`));
    taskCardContainer.append($(`<p class="card-title" style="padding-right:0px">${taskAssignment.task.processId}</p>`));
    taskCardContainer.append($(`<p class="card-text" style="padding-right:0px">${taskAssignment.task.state}</p>`));

    //always a string array in the format ["manager", "employee"]
    const taskGroups = taskAssignment.task.potentialGroups;
    //always a string array in the format ["skill1", "skill2"]
    const taskSkills = taskAssignment.task.attributes["SKILLS"];

    $("<hr style='margin-top: 0px;margin-bottom: 0px;'>").appendTo(taskCardContainer);
    printGroups(taskCardContainer, taskGroups);
    $("<hr style='margin-top: 0px;margin-bottom: 0px;'>").appendTo(taskCardContainer);
    printSkills(taskCardContainer, taskSkills);
}

function printSkills(container, skills) {
    const skillRow = $('<div class="row" style="margin:4px 2px 4px 0px">');
    container.append(skillRow);

    if (skills !== null && skills !== undefined) {
        skills.forEach((skill) => {
            let color = skillToColorMap.get(skill);
            skillRow.append($(`
            <div class="col-xs-1 card" style="background-color:${color};margin:2px;padding:2px">
                <span style="font-size:0.8em">${skill}</span>
            </div>`)
            );
        });
    }
}

function printGroups(container, groups) {
    const groupRow = $('<div class="row" style="margin:4px 2px 4px 0px">');
    container.append(groupRow);

    if (groups !== null && groups !== undefined) {
        groups.forEach((group) => {
            let color = groupToColorMap.get(group);
            groupRow.append($(`
            <div class="col-xs-1 card" style="background-color:${color};margin:2px;padding:2px">
                <span style="font-size:0.8em">${group}</span>
            </div>`)
            );
        });
    }
}

function startPeriodicRefresh() {
    periodicRefreshStarted = false;
    refreshPeriodicRefreshStatus();
}

function stopPeriodicRefresh() {
    periodicRefreshStarted = true;
    refreshPeriodicRefreshStatus();
}

function refreshPeriodicRefreshStatus() {
    if (!periodicRefreshStarted) {
        $("#refreshButton").hide();
        $("#startPeriodicRefreshButton").hide();
        $("#stopPeriodicRefreshButton").show();
        if (autoRefreshIntervalId == null) {
            autoRefreshIntervalId = setInterval(refreshSolution, 1000);
        }
    } else {
        $("#refreshButton").show();
        $("#startPeriodicRefreshButton").show();
        $("#stopPeriodicRefreshButton").hide();
        if (autoRefreshIntervalId != null) {
            clearInterval(autoRefreshIntervalId);
            autoRefreshIntervalId = null;
        }
    }
}

const formatErrorResponseBody = (body) => {
    // JSON must not contain \t (Quarkus bug)
    const json = JSON.parse(body.replace(/\t/g, '  '));
    return `${json.details}\n${json.stack}`;
};

const handleErrorResponse = (title, response) => {
    return response.text()
            .then((body) => {
                const message = `${title} (${response.status}: ${response.statusText}).`;
                const stackTrace = body ? formatErrorResponseBody(body) : '';
                showError(message, stackTrace);
            });
};

const handleClientError = (title, error) => {
    console.error(title + "\n" + error);
    showError(`${title}.`,
            // Stack looks differently in Chrome and Firefox.
            error.stack.startsWith(error.name)
                    ? error.stack
                    : `${error.name}: ${error.message}\n    ${error.stack.replace(/\n/g, '\n    ')}`);
};

function showError(message, stackTrace) {
    const notification = $(`<div class="toast" role="alert" aria-live="assertive" aria-atomic="true" style="min-width: 30rem"/>`)
            .append($(`<div class="toast-header bg-danger">
                 <strong class="mr-auto text-dark">Error</strong>
                 <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                   <span aria-hidden="true">&times;</span>
                 </button>
               </div>`))
            .append($(`<div class="toast-body"/>`)
                    .append($(`<p/>`).text(message))
                    .append($(`<pre/>`)
                            .append($(`<code/>`).text(stackTrace))
                    )
            );
    $('#notificationPanel').append(notification);
    notification.toast({delay: 30000});
    notification.toast('show');
}

$(document).ready(function () {

    //Initialize button listeners
    $('#refreshButton').click(function () {
        refreshSolution()
    });

    $('#startPeriodicRefreshButton').click(function () {
        startPeriodicRefresh();
    });

    $('#stopPeriodicRefreshButton').click(function () {
        stopPeriodicRefresh();
    });

    //Initial solution loading
    refreshSolution();

});