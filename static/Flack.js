// Setting local storage
if(!localStorage.getItem('username')){
    localStorage.setItem('username', "")
}
if(!localStorage.getItem('ChannelDetails')){
    localStorage.setItem("ChannelDetails",{channel_Details:[]});
}
if(!localStorage.getItem('CurrentChannel')){
    localStorage.setItem('CurrentChannel',"")
}

class ChannelMessage{
    constructor(username,message,dateTime){
        this.username = username;
        this.message = message;
        this.dateTime = dateTime;
    }
}

class Channel{
    constructor(channelName,ChannelMessage){
        this.channelName = channelName;
        this.ChannelMessage = ChannelMessage;
    }
}

document.addEventListener('DOMContentLoaded',()=>{

    // Variable initialisation
    var channelList = localStorage.getItem('ChannelDetails');
    var username = localStorage.getItem('username');
    var currentChannel = localStorage.getItem('CurrentChannel');

    document.querySelector('#submitMessage').disabled = true;

    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    
    // Username Functions and events
    if(username==""){
        PromptForUserName();
    }
    else{
        document.getElementById('UserName').textContent = username;
    }

    document.getElementById('ChangeUserName').onclick = ()=>{
        PromptForUserName();
        username = localStorage.getItem('username');
    };

    // Creating Channel
    document.getElementById('AddChannel').onclick = ()=>{
        let channelName = prompt("Enter Channel name");
        let isNameExist = false;
        if(Object.keys(channelList).length!=0 && Object.keys(channelList).length!=15){
            channelList.channel_Details.forEach(element => {
                if (channelName == element.channel_name) {
                    alert("The Channel name already exist");
                    isNameExist = true;
                    return;
                }   
            });
            if(!isNameExist){
                AddChannelToList(channelName);
            }
        }
        else{
            AddChannelToList(channelName);
        }
    };

    // Adding existing channels to list
    if(Object.keys(channelList).length>15){
        channelList = JSON.parse(channelList);
        let channelList_list = [];
        channelList.channel_Details.forEach(channelElement => {
            channelList_list.push(channelElement.channel_name);
        });
        DisplayChannelList(channelList_list);
    }

    // Display current channel
    if(currentChannel!=null){
        document.getElementById('ChannelName').innerText = currentChannel;
        document.querySelectorAll('li').forEach(li => {
            if(li.innerText == currentChannel){
                li.style.color = 'white';
            }
        });
        DisplayChannelMessage(currentChannel);
    }

    // Click event to access a channel
    document.querySelectorAll('li').forEach(li => {
        li.onclick = () => {
            let channelName = li.innerText;
            document.getElementById('ChannelName').innerHTML = channelName;
            document.querySelectorAll('li').forEach(li=>{
                li.style.color = 'black';
            });
            li.style.color = 'white';
            localStorage.setItem('CurrentChannel',channelName);
            DisplayChannelMessage(channelName);
        }
    });

    // Check messageBox is empty or not
    document.getElementById('MessageBox').onkeyup = () => {
        if(document.querySelector('#MessageBox').value.length>0){
            document.querySelector('#submitMessage').disabled = false;
        }
        else{
            document.querySelector('#submitMessage').disabled = true;
        }
    };

    socket.on('connect',()=>{
        // Adding message to list
        document.querySelector('#sendMessage').onsubmit = () => {
            let message = document.querySelector('#MessageBox').value;
            let activeChannel = localStorage.getItem('CurrentChannel');
            let timestamp = creatingTimeStamp();

            AddingMessagetoChannel(username,message,activeChannel,timestamp);

            document.querySelector('#MessageBox').value = '';
            document.querySelector('#submitMessage').disabled = true;

            var channel_message = new ChannelMessage(username,message,timestamp);
            var channel_data = new Channel(activeChannel,channel_message);
            socket.emit('send message',{'channel_data':channel_data});

            return false;
        };
    });

    socket.on('sendingMessage',data => {
        let channel_name = data.channel_data.channelName;
        DisplayChannelMessage(channel_name);
    });
});

// Functions 

function PromptForUserName(){
    username = prompt("Enter a username");
    if(username==""){
        alert("Enter a valid username");
        PromptForUserName();
    }
    else{
        document.getElementById("UserName").textContent = username;
        localStorage.setItem('username',username);
    }
}

function AddChannelToList(channelName){
    let channelDetails = localStorage.getItem('ChannelDetails');
    if(Object.keys(channelDetails).length>15){
        var data = JSON.parse(channelDetails);
    }
    else{
        var data = {channel_Details:[]};
    }
    data.channel_Details.push({
        channel_name : channelName,
        channel_message : [null]
    });
    let channelDetailsJSON = JSON.stringify(data);
    localStorage.setItem('ChannelDetails',channelDetailsJSON);

    const li = document.createElement('li');
    li.id = channelName;
    li.innerHTML = channelName;

    document.getElementById('ChannelList').append(li);

    window.location.reload();

    document.getElementById('ChannelList').innerHTML = "";
    let channelList = localStorage.getItem('ChannelDetails');
    channelList = JSON.parse(channelList);
        let channelList_list = [];
        channelList.channel_Details.forEach(channelElement => {
            channelList_list.push(channelElement.channel_name);
        });
    DisplayChannelList(channelList_list);
}

function DisplayChannelList(channelNameList){
    channelNameList.forEach(channelName=>{
        const li = document.createElement('li');
        li.innerHTML = channelName;
        li.id = channelName;

        document.getElementById('ChannelList').append(li);
    })
}

function creatingTimeStamp(){
    let dateTime = new Date();
    let dateValue = " " + dateTime.toDateString()+" ";
    let time = dateTime.toTimeString();
    let timeValue = time.slice(0,5);
    let timestamp = dateValue.concat(timeValue);

    return timestamp;
}

function AddingMessageHTMLtoChannel(username,message,timestamp){
    const message_para = document.createElement('p');
    message_para.innerHTML = message;
    const username_span = document.createElement('span');
    username_span.innerText = username;
    const dateTime_span = document.createElement('span');
    dateTime_span.innerText = timestamp;

    const li = document.createElement('li');
    li.append(username_span);
    li.append(dateTime_span);
    li.append(message_para);

    document.getElementById('MessageCenter').append(li);
}

function SavingMessageInChannel(channelName, messageObject){
    let channelDetails = localStorage.getItem('ChannelDetails');
    if(Object.keys(channelDetails).length>15){
        var data = JSON.parse(channelDetails);
    }
    else{
        var data = {channel_Details:[]};
    }
    data.channel_Details.forEach(channel => {
        if(channelName == channel.channel_name){
            channel.channel_message.push(messageObject);
            if (channel.channel_message.length>100){
                channel.channel_message.shift();
            }
        }
    });
    channelDetails = JSON.stringify(data);

    localStorage.setItem('ChannelDetails',channelDetails);
}

function AddingMessagetoChannel(username,message,channelName,timestamp){
    AddingMessageHTMLtoChannel(username,message,timestamp);

    let message_object = new ChannelMessage(username,message,timestamp);
    SavingMessageInChannel(channelName, message_object);
}


function DisplayChannelMessage(channelName){
    // Empty the previous channel message box
    document.getElementById("MessageCenter").innerHTML = "";

    let channelDetails = localStorage.getItem('ChannelDetails');
    if(Object.keys(channelDetails).length>15){
        var data = JSON.parse(channelDetails);
    }
    else{
        var data = {channel_Details:[]};
    }
    data.channel_Details.forEach(channel => {
        if(channelName == channel.channel_name){
            let messageList = channel.channel_message;
            if(messageList.length>1){
                messageList.forEach(message => {
                    if(message!=null){
                        AddingMessageHTMLtoChannel(message.username,message.message,message.dateTime);
                    }
                });
            }
            else{
                const li = document.createElement('li');
                li.innerHTML = "No message in this channel";

                document.getElementById("MessageCenter").append(li);
            }
        }
    });
}