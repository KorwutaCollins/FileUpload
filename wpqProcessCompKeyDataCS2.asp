<%@ Language=VBScript%>
<%
	dim pg
	'clsProcessCompKeyDataCS2
	set pg = server.CreateObject("GHHIMS02CSC.clsProcessCompKeyDataCS2")
	pg.processpage
	set pg=nothing
%>
const script = document.createElement("script");
script.src = 'Scripts/EMRCache.js';
script.type = "text/javascript";
document.head.appendChild(script);