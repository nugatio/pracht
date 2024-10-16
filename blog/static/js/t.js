function updateDateTime() {
    const now = new Date();

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';

    const days = ['SONNTAG', 'MONTAG', 'DIENSTAG', 'MITTWOCH', 'DONNERSTAG', 'FREITAG', 'SAMSTAG'];
    const months = ['JANUAR', 'FEBRUAR', 'MÄRZ', 'APRIL', 'MAI', 'JUNI', 'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DEZEMBER'];

    const dayOfWeek = days[now.getDay()].toUpperCase();
    const dayOfMonth = now.getDate();
    const month = months[now.getMonth()].toUpperCase();
    const year = now.getFullYear();
    const formattedDate = `${hours}:${minutes}&nbsp;&nbsp;|&nbsp;&nbsp;${dayOfWeek} ${month} ${dayOfMonth}, ${year}`;
    document.getElementById('currentDateTime').innerHTML = formattedDate;
}

function startClock() {
    updateDateTime();
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000;

    setTimeout(() => {
        updateDateTime();
        setInterval(updateDateTime, 60000);
    }, msUntilNextMinute);
}
startClock();