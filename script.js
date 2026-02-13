const API_URL="https://jsonplaceholder.typicode.com/users";

let users=[];
let editId=null;
let chart=null;
let currentChartType="bar";

const container=document.getElementById("usersContainer");
const searchInput=document.getElementById("searchInput");
const toast=document.getElementById("toast");
const companyFilter=document.getElementById("companyFilter");

const userCount=document.getElementById("userCount");
const companyCount=document.getElementById("companyCount");

// Load from LocalStorage
function loadUsers(){
    const saved=localStorage.getItem("users");
    if(saved){
        users=JSON.parse(saved);
        renderUsers();
        renderChart();
        updateStats();
        populateCompanyFilter();
    }else{
        fetchUsers();
    }
}

// Save to LocalStorage
function saveToLocal(){
    localStorage.setItem("users",JSON.stringify(users));
}

// Fetch API
async function fetchUsers(){
    const res=await fetch(API_URL);
    users=await res.json();
    saveToLocal();
    renderUsers();
    renderChart();
    updateStats();
    populateCompanyFilter();
}

// Render Users
function renderUsers(){
    container.innerHTML="";

    const filtered=users
        .filter(u=>u.name.toLowerCase().includes(searchInput.value.toLowerCase()))
        .filter(u=>!companyFilter.value || 
            (u.company?.name||u.company)===companyFilter.value
        );

    filtered.forEach(user=>{
        const div=document.createElement("div");
        div.className="user-card";
        div.innerHTML=`
            <h3>${user.name}</h3>
            <p>${user.email}</p>
            <p>${user.company?.name || user.company}</p>
            <button onclick="editUser(${user.id})">Edit</button>
            <button onclick="deleteUser(${user.id})">Delete</button>
        `;
        container.appendChild(div);
    });

    updateStats();
}

// Animated Stats
function animateValue(element,value){
    let start=0;
    const duration=800;
    const step=value/(duration/16);

    const counter=setInterval(()=>{
        start+=step;
        if(start>=value){
            start=value;
            clearInterval(counter);
        }
        element.textContent=Math.floor(start);
    },16);
}

function updateStats(){
    animateValue(userCount,users.length);

    const companies=new Set(users.map(u=>u.company?.name||u.company));
    animateValue(companyCount,companies.size);
}

// Populate Company Filter
function populateCompanyFilter(){
    const companies=[...new Set(users.map(u=>u.company?.name||u.company))];
    companyFilter.innerHTML='<option value="">All Companies</option>';
    companies.forEach(c=>{
        const opt=document.createElement("option");
        opt.value=c;
        opt.textContent=c;
        companyFilter.appendChild(opt);
    });
}

// Chart
function renderChart(){

    const companyData={};

    users.forEach(user=>{
        const company=user.company?.name||user.company;
        companyData[company]=(companyData[company]||0)+1;
    });

    if(chart) chart.destroy();

    chart=new Chart(document.getElementById("companyChart"),{
        type:currentChartType,
        data:{
            labels:Object.keys(companyData),
            datasets:[{
                label:"Users per Company",
                data:Object.values(companyData),
                tension:0.4
            }]
        }
    });
}

function changeChart(type){
    currentChartType=type;
    renderChart();
}

// CRUD
function saveUser(){
    const name=nameInput.value;
    const email=emailInput.value;
    const company=companyInput.value;

    if(editId){
        const user=users.find(u=>u.id===editId);
        user.name=name;
        user.email=email;
        user.company={name:company};
    }else{
        users.unshift({
            id:Date.now(),
            name,
            email,
            company:{name:company}
        });
    }

    saveToLocal();
    renderUsers();
    renderChart();
    closeForm();
}

function deleteUser(id){
    users=users.filter(u=>u.id!==id);
    saveToLocal();
    renderUsers();
    renderChart();
}

// Export CSV
function exportCSV(){
    let csv="Name,Email,Company\n";
    users.forEach(u=>{
        csv+=`${u.name},${u.email},${u.company?.name||u.company}\n`;
    });

    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="users.csv";
    a.click();
}

// Download Chart
function downloadChart(){
    const link=document.createElement("a");
    link.href=chart.toBase64Image();
    link.download="chart.png";
    link.click();
}

searchInput.addEventListener("input",renderUsers);
companyFilter.addEventListener("change",renderUsers);

document.getElementById("themeToggle").addEventListener("click",()=>{
    document.body.classList.toggle("dark");
});

loadUsers();
