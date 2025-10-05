// =========================================================================
// ۱. آدرس ثابت پروژه (فقط CSV)
// =========================================================================

// !!! این آدرس را با آدرس نهایی Publish to web شیت خود جایگزین کنید !!!
const SHEET_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR71KesL1HDhke0Y-CKlideg_HzLQe8_pY4ySxqGv6mHdo7uzQJvGAum7X0Y_EPDfsooa5U4aG6hD1K/pub?gid=0&single=true&output=csv'; 

// =========================================================================
// ۲. تابع ساخت کارت و رندر (ساده شده برای نمایش در صفحه اصلی)
// =========================================================================

function createMemberCard(member) {
    const fullImageAddress = member['لینک تصویر'] || ''; 
    const name = member['نام نماینده'] || 'نام نامشخص';
    
    const imageURL = fullImageAddress ? fullImageAddress : 'https://via.placeholder.com/120x120.png?text=No+Photo'; 

    // کد نماینده را به صورت رمزنگاری شده (Base64) برای باز کردن مدال ارسال می‌کنیم
    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(member))));

    return `
        <div class="member-card" onclick="openMemberModal('${encodedData}')">
            <img 
                class="member-image" 
                src="${imageURL}" 
                alt="تصویر ${name}" 
                loading="lazy" 
                onerror="this.onerror=null;this.src='https://via.placeholder.com/120x120.png?text=Broken';"
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

    const name = member['نام نماینده'] || 'نام نامشخص';
    const constituency = member['حوزه انتخابیه'] || 'حوزه نامشخص';
    const commission = member['کمیسیون'] || 'کمیسیون نامشخص';
    const imageURL = member['لینک تصویر'] || 'https://via.placeholder.com/150x150.png?text=No+Photo'; 
    
    // پر کردن اطلاعات مدال
    document.getElementById('modal-name').innerText = name;
    document.getElementById('modal-image').src = imageURL;

    const detailsHTML = `
        <p><strong>نام و نام خانوادگی:</strong> ${name}</p>
        <p><strong>حوزه انتخابیه:</strong> ${constituency}</p>
        <p><strong>کمیسیون:</strong> ${commission}</p>
        <p><strong>شناسه عضو:</strong> ${member['FileID'] || 'نامشخص'}</p>
    `;
    document.getElementById('modal-details').innerHTML = detailsHTML;
    
    // ساخت دکمه‌ها
    const baseLink = `https://yourdomain.com/profile/${member['نام نماینده']}`; // لینک پایه را بر اساس دامنه خود تنظیم کنید
    
    const buttonsHTML = `
        <a href="${baseLink}/profile" target="_blank" class="btn-profile"><i class="fas fa-user-circle"></i> پروفایل نماینده</a>
        <a href="${baseLink}/statements" target="_blank"><i class="fas fa-microphone"></i> مواضع و مصاحبه‌ها</a>
        <a href="${baseLink}/sessions" target="_blank"><i class="fas fa-gavel"></i> جلسات و تصمیمات</a>
        <a href="${baseLink}/foundation-activities" target="_blank"><i class="fas fa-building"></i> عملکرد بنیاد در حوزه انتخابیه</a>
        <a href="${baseLink}/analysis" target="_blank"><i class="fas fa-chart-line"></i> تحلیل تعاملات</a>
    `;
    document.getElementById('modal-buttons').innerHTML = buttonsHTML;

    modal.style.display = 'block';
}

function closeModal(event) {
    const modal = document.getElementById('memberModal');
    // اگر کلیک مستقیماً روی دکمه X یا پس زمینه (overlay) بود، مدال را ببند
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