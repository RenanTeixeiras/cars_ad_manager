 // Script para manipulação do upload de imagens
 document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('image-upload');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const publishBtn = document.getElementById('publicar');
    const successMessage = document.getElementById('success-message');
    
    // Evento de clique para o upload de imagens
    imageUpload.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Evento de mudança para o input de arquivo
    fileInput.addEventListener('change', function() {
        const files = this.files;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (!file.type.match('image.*')) {
                continue;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imagePreview = document.createElement('div');
                imagePreview.className = 'image-preview';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                
                const deleteButton = document.createElement('div');
                deleteButton.className = 'delete-image';
                deleteButton.innerHTML = '<i class="fas fa-times"></i>';
                
                deleteButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    imagePreview.remove();
                });
                
                imagePreview.appendChild(img);
                imagePreview.appendChild(deleteButton);
                previewContainer.appendChild(imagePreview);
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    // Evento de envio do formulário
    publishBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // Aqui você pode adicionar a lógica para processar o formulário
        // e redirecionar para a tela de seleção de plataformas
        window.location.href = 'publicar.html';
    });
    
    // Para demonstração - mostrar mensagem de sucesso
    document.getElementById('salvar').addEventListener('click', function() {
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    });
});