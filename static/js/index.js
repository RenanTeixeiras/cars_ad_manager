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
    

    // Script para manipulação do upload de imagens e seleção de veículos
document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('image-upload');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const publishBtn = document.getElementById('publicar');
    const successMessage = document.getElementById('success-message');
    const veiculoSelect = document.getElementById('veiculo');
    
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
        // Adicionar a ação 'publicar' para ser processada no backend
        const actionInput = document.createElement('input');
        actionInput.type = 'hidden';
        actionInput.name = 'acao';
        actionInput.value = 'publicar';
        document.getElementById('vehicle-form').appendChild(actionInput);
        // Não prevenimos o comportamento padrão para permitir o envio normal do formulário
    });
    
    // Evento para salvar como rascunho
    document.getElementById('salvar').addEventListener('click', function(e) {
        e.preventDefault();
        // Adicionar a ação 'rascunho' para ser processada no backend
        const actionInput = document.createElement('input');
        actionInput.type = 'hidden';
        actionInput.name = 'acao';
        actionInput.value = 'rascunho';
        
        const form = document.getElementById('vehicle-form');
        form.appendChild(actionInput);
        form.submit();
        
        // Mostrar mensagem de sucesso temporariamente (poderia ser removido quando implementado no backend)
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    });
    
    // Evento de mudança no select de veículos
    veiculoSelect.addEventListener('change', function() {
        const veiculoId = this.value;
        if (veiculoId) {
            // Fazer uma requisição AJAX para obter os dados completos do veículo
            fetch(`/api/veiculo/${veiculoId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao buscar dados do veículo');
                    }
                    return response.json();
                })
                .then(data => {
                    // Preencher os campos do formulário com os dados do veículo
                    document.getElementById('marca').value = data.marca || '';
                    
                    // Se o select modelo ainda não tiver a opção do modelo carregado, adicionamos
                    const modeloSelect = document.getElementById('modelo');
                    let modeloOption = Array.from(modeloSelect.options).find(opt => opt.value === data.modelo);
                    
                    if (!modeloOption && data.modelo) {
                        modeloOption = document.createElement('option');
                        modeloOption.value = data.modelo;
                        modeloOption.text = data.modelo;
                        modeloSelect.appendChild(modeloOption);
                    }
                    
                    if (data.modelo) {
                        modeloSelect.value = data.modelo;
                    }
                    
                    document.getElementById('ano').value = data.ano_fabricacao || '';
                    document.getElementById('versao').value = data.versao || '';
                    document.getElementById('km').value = data.quilometragem || '';
                    document.getElementById('preco').value = data.preco || '';
                    
                    // Construir uma descrição completa do veículo
                    const descricao = `${data.marca || ''} ${data.modelo || ''} ${data.versao || ''}, 
                        Ano: ${data.ano_fabricacao || ''}, 
                        ${data.quilometragem || '0'}km, 
                        Combustível: ${data.combustivel || ''}, 
                        Câmbio: ${data.cambio || ''}, 
                        Cor: ${data.cor || ''}
                        ${data.tracao ? 'Tração: ' + data.tracao : ''}
                        ${data.potencia ? 'Potência: ' + data.potencia : ''}`;
                    
                    document.getElementById('descricao').value = descricao.replace(/\s+/g, ' ').trim();
                })
                .catch(error => {
                    console.error('Erro ao obter dados do veículo:', error);
                    alert('Não foi possível carregar os dados do veículo. Por favor, tente novamente.');
                });
        } else {
            // Limpar os campos se nenhum veículo for selecionado
            document.getElementById('marca').value = '';
            document.getElementById('modelo').value = '';
            document.getElementById('ano').value = '';
            document.getElementById('versao').value = '';
            document.getElementById('km').value = '';
            document.getElementById('preco').value = '';
            document.getElementById('descricao').value = '';
        }
    });
    
    // Atualizar modelos ao mudar a marca
    const marcaSelect = document.getElementById('marca');
    marcaSelect.addEventListener('change', function() {
        const marca = this.value;
        const modeloSelect = document.getElementById('modelo');
        
        // Limpar opções existentes
        modeloSelect.innerHTML = '<option value="">Selecione o modelo</option>';
        
        if (!marca) return;
        
        // Aqui você pode fazer uma requisição AJAX para buscar os modelos da marca selecionada
        // Para simplificar, vamos adicionar alguns modelos para cada marca de exemplo
        const modelosPorMarca = {
            chevrolet: ['Onix', 'Cruze', 'S10', 'Tracker'],
            fiat: ['Uno', 'Palio', 'Toro', 'Strada'],
            ford: ['Ka', 'Fiesta', 'Focus', 'Ranger'],
            honda: ['Civic', 'City', 'Fit', 'HR-V'],
            hyundai: ['HB20', 'Creta', 'Tucson', 'i30'],
            toyota: ['Corolla', 'Yaris', 'Hilux', 'RAV4'],
            volkswagen: ['Gol', 'Polo', 'Golf', 'T-Cross']
        };
        
        const modelos = modelosPorMarca[marca] || [];
        
        modelos.forEach(modelo => {
            const option = document.createElement('option');
            option.value = modelo.toLowerCase();
            option.text = modelo;
            modeloSelect.appendChild(option);
        });
    });
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