// =========================================================================
// ۱. آدرس ثابت پروژه (فقط CSV)
// =========================================================================

// !!! این آدرس را با آدرس نهایی Publish to web شیت خود جایگزین کنید !!!
const SHEET_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR71KesL1HDhke0Y-CKlideg_HzLQe8_pY4ySxqGv6mHdo7uzQJvGAum7X0Y_EPDfsooa5U4aG6hD1K/pub?output=csv'; 

// =========================================================================
// ۲. تابع ساخت کارت و رندر 
// =========================================================================

function createMemberCard(member) {
    // آدرس تصویر از سرستون "تصویر" خوانده می‌شود
    const fullImageAddress = member['تصویر'] || ''; 
    const name = member['نام نماینده'] || 'نام نامشخص';
    
    const imageURL = fullImageAddress ? fullImageAddress : 'https://via.placeholder.com/100x100.png?text=No+Photo'; 

    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(member))));

    return `
        <div class="member-card" onclick="openMemberModal('${encodedData}')">
            <img 
                class="member-image" 
                src="${imageURL}" 
                alt="تصویر ${name}" 
                loading="lazy" 
                onerror="this.onerror=null;this.src='https://via.placeholder.com/100x100.png?text=Broken';"
            >
            <h4>${name}</h4>
        </div>
    `;
}

// =========================================================================
// ۳. توابع پشتیبانی مدال (Modal Functions)
// =========================================================================

function openMemberModal(encodedData) {
    const modal = document.getElementById('memberModal');
    
    // دیکد کردن اطلاعات نماینده
    const member = JSON.parse(decodeURIComponent(escape(atob(encodedData))));

    // خواندن داده‌ها از سرستون‌های جدید
    const name = member['نام نماینده'] || 'نام نامشخص';
    const constituency = member['حوزه انتخابیه'] || 'حوزه نامشخص';
    const commission = member['کمیسیون'] || 'کمیسیون نامشخص';
    const province = member['استان'] || 'نامشخص'; // ستون "استان"
    const imageURL = member['تصویر'] || 'https://via.placeholder.com/126x126.png?text=No+Photo'; // اندازه placeholder مطابق CSS جدید
    
    // خواندن لینک‌ها و نام‌های جدید ستون‌ها
    const linkProfile = member['پروفایل نماینده'] || '#';
    const linkStatements = member['مواضع و مصاحبه‌ها'] || '#';
    const linkSessions = member['جلسات و دیدارها'] || '#'; // نام ستون جدید: جلسات و دیدارها
    const linkFoundationActivities = member['عملکرد بنیاد در حوزه انتخابیه'] || '#';
    const linkAnalysis = member['تحلیل و ارزیابی'] || '#'; // نام ستون جدید: تحلیل و ارزیابی
    
    // پر کردن اطلاعات مدال
    document.getElementById('modal-name').innerText = name;
    document.getElementById('modal-image').src = imageURL;

    // نمایش "استان" به جای "شناسه عضو" با رنگ تیتر مجزا
    const detailsHTML = `
        <p><strong>نام و نام خانوادگی:</strong> <span>${name}</span></p>
        <p><strong>استان:</strong> <span>${province}</span></p>
        <p><strong>حوزه انتخابیه:</strong> <span>${constituency}</span></p>
        <p><strong>کمیسیون:</strong> <span>${commission}</span></p>
    `;
    document.getElementById('modal-details').innerHTML = detailsHTML;
    
    // ساخت دکمه‌ها با لینک‌ها و نام‌های جدید
    const buttonsHTML = `
        <a href="${linkProfile}" target="_blank" class="btn-profile"><i class="fas fa-user-circle"></i> پروفایل نماینده</a>
        <a href="${linkStatements}" target="_blank"><i class="fas fa-microphone-alt"></i> مواضع و مصاحبه‌ها</a>
        <a href="${linkSessions}" target="_blank"><i class="fas fa-gavel"></i> جلسات و دیدارها</a>
        <a href="${linkFoundationActivities}" target="_blank"><i class="fas fa-city"></i> عملکرد بنیاد در حوزه انتخابیه</a>
        <a href="${linkAnalysis}" target="_blank"><i class="fas fa-chart-line"></i> تحلیل و ارزیابی</a>
    `;
    document.getElementById('modal-buttons').innerHTML = buttonsHTML;

    modal.style.display = 'block';
}

function closeModal(event) {
    const modal = document.getElementById('memberModal');
    if (event.target === modal || event.target.className === 'close-button') {
        modal.style.display = 'none';
    }
}

// بستن مدال با کلید ESC
window.onkeydown = function(event) {
    if (event.key === 'Escape') {
        document.getElementById('memberModal').style.display = 'none';
    }
}


// =========================================================================
// ۴. توابع پشتیبانی (CSV to JSON) و اجرای اصلی (بدون تغییر)
// =========================================================================

function csvToJson(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',').map(item => item.trim().replace(/"/g, ''));
        if (currentLine.length !== headers.length) continue;

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentLine[j];
        }
        result.push(obj);
    }
    return result;
}

async function loadMembers() {
    const container = document.getElementById('members-container');
    container.innerHTML = '<div class="loading">در حال بارگذاری داده‌ها...</div>'; 

    try {
        const response = await fetch(SHEET_DATA_URL);
        
        if (!response.ok) {
            throw new Error(`خطا در دسترسی به شیت گوگل: وضعیت ${response.status}.`);
        }
        
        const csvText = await response.text();
        const membersData = csvToJson(csvText);
        
        if (membersData.length === 0) {
            container.innerHTML = '<div class="error">هیچ داده‌ای در شیت پیدا نشد.</div>';
            return;
        }

        let allCardsHTML = '';
        membersData.forEach(member => {
            allCardsHTML += createMemberCard(member);
        });
        
        container.innerHTML = allCardsHTML;

    } catch (error) {
        console.error('خطا در بارگذاری داده‌ها:', error);
        container.innerHTML = `<div class="error">مشکل بحرانی در بارگذاری: ${error.message}</div>`;
    }
}

loadMembers();
