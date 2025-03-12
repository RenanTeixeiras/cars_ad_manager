function toggleSelection(card) {
    card.classList.toggle('selected');
}

function publishAd() {
    // Simular processo de publicação
    const statusSection = document.getElementById('publication-status');
    statusSection.style.display = 'block';
    
    // Scroll para mostrar o status
    window.scrollTo({
        top: statusSection.offsetTop,
        behavior: 'smooth'
    });
    
    // Simular mudança de status após alguns segundos
    setTimeout(() => {
        const statusItems = document.querySelectorAll('.status-item');
        statusItems.forEach((item, index) => {
            const status = item.querySelector('.status');
            const indicator = item.querySelector('.status-indicator');
            
            if (index % 2 === 0) {
                indicator.classList.remove('pending');
                indicator.classList.add('published');
                status.innerHTML = '<div class="status-indicator published"></div><span>Publicado</span>';
            }
        });
    }, 3000);
}