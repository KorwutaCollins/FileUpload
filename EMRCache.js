let cacheAvailable = false;
let gCache = {};
let restoreClicked = false;
let triggerTimes = 0;
let startCache = true;
let cacheExpirationTime = 1 * 24 * 60 * 60 * 1000;
manageCache();

window.addEventListener('input',(e)=>{
   cacheDataWithDebouce();
})
window.addEventListener('click',(e)=>{
   if(e.target.type != "submit"){
      cacheDataWithDebouce();
   }
});

function manageCache(){
   const keys = Object.keys(localStorage);
   for(const key of keys){
      try{
         if(/^.+\|\|\|.+\|\|\|\w+\|\|\|.+\|\|\|.+$/.test(key)){
            const json = JSON.parse(localStorage.getItem(key));
            if(json && json['time']){
               if(json['time'] < Date.now()){
                  localStorage.removeItem(key);
               }
            }
         }
      }catch(e){
         console.error(e);
      }
   }
}

let cacheDataWithDebouce = debounce(cacheData,500)
let clearWithDebounce = debounce(clearCache,5000)
function debounce(func,delay){
   let timeout = null;
   return function(...args){
      timeout = setTimeout(()=>{
         func.call(window,...args);
      },delay)
   }
}

function clearCache(){
   const recID = 
      `${GetPageVariable("EditCompTbl")}|||${GetPageVariable("EditCompKey")}|||${GetPageVariable("EditCompVal")}|||${GetPageVariable("SystemUserID")}|||${GetPageVariable("ctxPrimaryKeyValue")}`
   localStorage.removeItem(recID.toUpperCase());
   restoreClicked = false;
}
function cacheData(){
   if(GetPageVariable("ctxPrimaryKeyValue")!=="" && startCache){
      const recID = 
      `${GetPageVariable("EditCompTbl")}|||${GetPageVariable("EditCompKey")}|||${GetPageVariable("EditCompVal")}|||${GetPageVariable("SystemUserID")}|||${GetPageVariable("ctxPrimaryKeyValue")}`
      const record = {}
      window.document.querySelectorAll(`[id^="cmdMultiLgGrp||${GetPageVariable("EditCompVal")}" i],[id^="${GetPageVariable("EditCompVal")}" i],[id^="usrDate||${GetPageVariable("EditCompVal")}" i],[id^="trCmp||${GetPageVariable("EditCompVal")}" i]`).forEach(el=>{
         if(el.id && el?.value !== ""){
               if(el.tagName == 'INPUT' && ['checkbox','radio'].includes(el.type)){
                  if(el.checked){
                     record[el.id.toUpperCase()] = el.value;
                  }
               }else if(el.tagName == 'INPUT' && el.type==="button"){
                  record[el.id.toUpperCase()] = el.closest('table').parentNode.innerHTML;
               }else{
                  record[el.id.toUpperCase()] = el?.value;
               }
         }
      })
      record['time'] = Date.now() + cacheExpirationTime;
      localStorage.setItem(recID.toUpperCase(),JSON.stringify(record));
      triggerTimes++;
      if(triggerTimes >= 3){
         startCache = true;
         removeRestoreBtn();
      }
   }
}

window.open = function(open){
   return function(url,target,prop){
      win = open.call(window,url,target,prop);
      win.addEventListener('load',function(){
         win.cmdApplySelectGrpOnClick = function(cmdApplySelectGrpOnClick){
            return function(__evt){
               cmdApplySelectGrpOnClick();
               cacheDataWithDebouce();
            }
         }(win.cmdApplySelectGrpOnClick);
      })
      return win;
   }
}(window.open);


window.GetClientSubCompHtmlCont = function(GetClientSubCompHtmlCont){
   return function(readyState, responseText){
      GetClientSubCompHtmlCont.call(window,readyState, responseText);
      if(restoreClicked){
         retrieveData();
      }
   }
}(window.GetClientSubCompHtmlCont);

function retrieveData(){
   for(const key of Object.keys(gCache)){
      const ele = document.querySelector(`[id="${key}" i]`);
      if(ele && gCache[key] !== null){
         if(ele?.tagName == 'INPUT' && ['radio','checkbox'].includes(ele?.type) && gCache[key] !== null){
            if(!ele.checked){
               ifOtherElementHasSameID = document.querySelectorAll(`[id="${ele.id}" i]`);
               if(ifOtherElementHasSameID.length>1){
                     ifOtherElementHasSameID.forEach(el=>{
                        if(el.value === gCache[key]){
                           el.click();
                           delete gCache[key];
                        }
                     })
               }else{
                     ele.click();
                     delete gCache[key];
               }
            }
         }else if(ele.tagName == 'INPUT' && ele.type === "button" && gCache[key] !== null){
            if(ele.closest('table').parentNode && gCache[key]){
               ele.closest('table').parentNode.innerHTML = gCache[key];
               delete gCache[key];
            }
         }else{
            if((ele.value == "" || /^0+.{0,1}0*/.test(ele.value)) && gCache[key] !== null){
               ele.value = gCache[key];
            }else if(ele.tagName == 'TD'){
               ele.textContent = gCache[key];
            }
            delete gCache[key];
         }
      }
   }
   clearWithDebounce();
}

function restoreDraft(){
   const ok = confirm('Are you sure you want to retrieve this Data? \n If Ok Please verify the data before saving'); 
   if(ok){
      restoreClicked = true;
      if(draftExists()){
            let recID = 
            `${GetPageVariable("EditCompTbl")}|||${GetPageVariable("EditCompKey")}|||${GetPageVariable("EditCompVal")}|||${GetPageVariable("SystemUserID")}|||${GetPageVariable("ctxPrimaryKeyValue")}`;
            let record = localStorage.getItem(recID.toUpperCase());
            gCache = record ? JSON.parse(record):{};
            retrieveData();
            removeRestoreBtn();
      }
   }
}
window.addEventListener('load',()=>{
   const buttonPoint = cmdSave.closest('td');
   const restorePoint = document.querySelector('[id="tblSub||EMRTemplate"] tr:nth-child(3)');
   restorePoint.style.position = 'relative';
   const clearTd = document.createElement('td');
   const draftTd = document.createElement('td');
   restoreTd = document.createElement('td');
   restoreTd.id = 'restoreTd'
   restoreTd.innerHTML = `<input type='button' style='background-color:#0078d4;color:white;border:none' value='Restore presave' onclick="restoreDraft()"/>`;
   restoreTd.style.cssText = "position: absolute;top:50%;transform: translateY(-50%);right: 0;";
   if (draftExists()) {
      restorePoint.appendChild(restoreTd);
      startCache = false;
   }
})

function removeRestoreBtn(){
   const restoreTd = document.getElementById("restoreTd");
   restoreTd?.remove();
}

function draftExists(){
    const url = new URL(window.location);
    const key = `${GetPageVariable("EditCompTbl")}|||${GetPageVariable("EditCompKey")}|||${GetPageVariable("EditCompVal")}|||${GetPageVariable("SystemUserID")}|||${GetPageVariable("ctxPrimaryKeyValue")}`
    const draftStr = localStorage.getItem(key.toUpperCase());
    return !!draftStr;
}
