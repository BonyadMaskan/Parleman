// =========================================================================
// ۱. آدرس CSV از گوگل شیت
// =========================================================================
const SHEET_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR71KesL1HDhke0Y-CKlideg_HzLQe8_pY4ySxqGv6mHdo7uzQJvGAum7X0Y_EPDfsooa5U4aG6hD1K/pub?output=csv';

// =========================================================================
// ۲. ساخت کارت هر نماینده
// =========================================================================
function createMemberCard(member) {
    const name = member['نام نماینده'] || 'نام نامشخص';
    const imageURL = member['تصویر'] || 'https://via.placeholder.com/100x100.png?text=No+Photo';

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
// ۳. باز کردن پاپ‌آپ جزئیات نماینده
// =========================================================================
function openMemberModal(encodedData) {
    const modal = document.getElementById('memberModal');
    const member = JSON.parse(decodeURIComponent(escape(atob(encodedData))));

    const name = member['نام نماینده'] || 'نام نامشخص';
    const constituency = member['حوزه انتخابیه'] || 'حوزه نامشخص';
    const commission = member['کمیسیون'] || 'کمیسیون نامشخص';
    const province = member['استان'] || 'استان نامشخص';
    const imageURL = member['تصویر'] || 'https://via.placeholder.com/140x140.png?text=No+Photo';

    // پر کردن اطلاعات مدال
    document.getElementById('modal-name').innerText = name;
    document.getElementById('modal-image').src = imageURL;

    const detailsHTML = `
        <p><strong>نام و نام خانوادگی:</strong> <span>${name}</span></p>
        <p><strong>استان:</strong> <span>${province}</span></p>
        <p><strong>حوزه انتخابیه:</strong> <span>${constituency}</span></p>
        <p><strong>کمیسیون:</strong> <span>${commission}</span></p>
    `;
    document.getElementById('modal-details').innerHTML = detailsHTML;

    // دکمه‌ها از لینک‌های شیت خوانده می‌شوند
    const profileLink = member['پروفایل نماینده'] || '#';
    const statementsLink = member['مواضع و مصاحبه‌ها'] || '#';
    const sessionsLink = member['جلسات و دیدارها'] || '#';
    const performanceLink = member['عملکرد بنیاد در حوزه انتخابیه'] || '#';
    const analysisLink = member['تحلیل و ارزیابی'] || '#';

    const buttonsHTML = `
        <a href="${profileLink}" target="_blank" class="btn-profile"><i class="fas fa-user-circle"></i> پروفایل نماینده</a>
        <a href="${statementsLink}" target="_blank"><i class="fas fa-microphone-alt"></i> مواضع و مصاحبه‌ها</a>
        <a href="${sessionsLink}" target="_blank"><i class="fas fa-handshake"></i> جلسات و دیدارها</a>
        <a href="${performanceLink}" target="_blank"><i class="fas fa-city"></i> عملکرد بنیاد در حوزه انتخابیه</a>
        <a href="${analysisLink}" target="_blank"><i class="fas fa-chart-line"></i> تحلیل و ارزیابی</a>
    `;
    document.getElementById('modal-buttons').innerHTML = buttonsHTML;

    modal.style.display = 'block';
}

// =========================================================================
// ۴. بستن مدال
// =========================================================================
function closeModal(event) {
    const modal = document.getElementById('memberModal');
    if (event.target === modal || event.target.className === 'close-button') {
        modal.style.display = 'none';
    }
}
window.onkeydown = function(event) {
    if (event.key === 'Escape') {
        document.getElementById('memberModal').style.display = 'none';
    }
};

// =========================================================================
// ۵. تابع تبدیل CSV به JSON
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

// =========================================================================
// ۶. بارگذاری داده‌ها از گوگل شیت
// =========================================================================
async function loadMembers() {
    const container = document.getElementById('members-container');
    container.innerHTML = '<div class="loading">در حال بارگذاری داده‌ها...</div>';

    try {
        const response = await fetch(SHEET_DATA_URL);
        if (!response.ok) throw new Error(`خطا در دسترسی به شیت گوگل: ${response.status}`);

        const csvText = await response.text();
        const membersData = csvToJson(csvText);

        if (membersData.length === 0) {
            container.innerHTML = '<div class="error">هیچ داده‌ای در شیت یافت نشد.</div>';
            return;
        }

        container.innerHTML = membersData.map(m => createMemberCard(m)).join('');

    } catch (error) {
        console.error('خطا در بارگذاری داده‌ها:', error);
        container.innerHTML = `<div class="error">مشکل در بارگذاری: ${error.message}</div>`;
    }
}

loadMembers();
