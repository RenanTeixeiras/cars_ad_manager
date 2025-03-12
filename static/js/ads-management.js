function toggleFilter() {
    const dropdown = document.getElementById('filter-dropdown');
    dropdown.classList.toggle('show');
}

function filterAds(filter) {
    // Lógica para filtrar anúncios
    console.log(`Filtrar por: ${filter}`);
    
    // Fechar o dropdown depois de selecionar
    const dropdown = document.getElementById('filter-dropdown');
    dropdown.classList.remove('show');
    
    // Para demonstração - mostrar estado vazio se 'inactive' for selecionado
    const adsContainer = document.querySelector('.ads-container');
    const emptyState = document.querySelector('.empty-state');
    const adItems = document.querySelectorAll('.ad-item');
    const adsHeader = document.querySelector('.ads-header');
    const pagination = document.querySelector('.pagination');
    
    if (filter === 'inactive' && Math.random() > 0.5) {
        // Simulando caso sem resultados
        adItems.forEach(item => item.style.display = 'none');
        adsHeader.style.display = 'none';
        emptyState.style.display = 'block';
        pagination.style.display = 'none';
    } else {
        // Com resultados
        adItems.forEach(item => item.style.display = 'grid');
        adsHeader.style.display = 'grid';
        emptyState.style.display = 'none';
        pagination.style.display = 'flex';
    }
}

function openStatsModal() {
    const modal = document.getElementById('stats-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeStatsModal() {
    const modal = document.getElementById('stats-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openDeleteModal() {
    const modal = document.getElementById('delete-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function deleteAd() {
    // Lógica para excluir o anúncio
    console.log('Anúncio excluído');
    
    // Fechar o modal
    closeDeleteModal();
    
    // Para demonstração - remover o item da lista
    const adItems = document.querySelectorAll('.ad-item');
    if (adItems.length > 0) {
        adItems[0].style.opacity = '0';
        adItems[0].style.height = '0';
        adItems[0].style.padding = '0';
        adItems[0].style.margin = '0';
        adItems[0].style.overflow = 'hidden';
        adItems[0].style.transition = 'all 0.3s';
        
        setTimeout(() => {
            adItems[0].remove();
            
            // Se não houver mais anúncios, mostrar estado vazio
            if (document.querySelectorAll('.ad-item').length === 0) {
                document.querySelector('.ads-header').style.display = 'none';
                document.querySelector('.empty-state').style.display = 'block';
                document.querySelector('.pagination').style.display = 'none';
            }
        }, 300);
    }
}

// Fechar o dropdown de filtro ao clicar fora
window.addEventListener('click', function(event) {
    const dropdown = document.getElementById('filter-dropdown');
    const filterBtn = document.querySelector('.filter-btn');
    
    if (!filterBtn.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Fechar modais ao clicar fora ou ao pressionar ESC
window.addEventListener('click', function(event) {
    const statsModal = document.getElementById('stats-modal');
    const deleteModal = document.getElementById('delete-modal');
    
    if (event.target === statsModal) {
        closeStatsModal();
    }
    
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});

window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeStatsModal();
        closeDeleteModal();
    }
});