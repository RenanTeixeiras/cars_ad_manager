// Script para manipulação do upload de imagens e seleção de veículos
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado - iniciando scripts");
    
    const imageUpload = document.getElementById('image-upload');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const publishBtn = document.getElementById('publicar');
    const successMessage = document.getElementById('success-message');
    const veiculoSelect = document.getElementById('veiculo');
    
    // Verificar se o select de veículos existe
    if (!veiculoSelect) {
        console.error("Elemento select 'veiculo' não encontrado!");
        return;
    }
    
    console.log("Select de veículos encontrado:", veiculoSelect);
    console.log("Opções disponíveis:", veiculoSelect.options.length);
    
    // Evento de clique para o upload de imagens
    if (imageUpload) {
        imageUpload.addEventListener('click', function() {
            fileInput.click();
        });
    }
    
    // Evento de mudança no select de veículos
    veiculoSelect.addEventListener('change', function() {
        const veiculoId = this.value;
        console.log("Veículo selecionado:", veiculoId);
        
        if (veiculoId) {
            // Fazer uma requisição para obter os dados do veículo
            const url = `/veiculo/${veiculoId}`;
            console.log("Fazendo requisição para:", url);
            
            fetch(url)
                .then(response => {
                    console.log("Status da resposta:", response.status);
                    if (!response.ok) {
                        throw new Error(`Erro na requisição: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Dados recebidos:", data);
                    
                    // Verificar todos os campos do formulário antes de preencher
                    const camposForm = {
                        marca: document.getElementById('marca'),
                        modelo: document.getElementById('modelo'),
                        ano: document.getElementById('ano'),
                        versao: document.getElementById('versao'),
                        km: document.getElementById('km'),
                        preco: document.getElementById('preco'),
                        descricao: document.getElementById('descricao')
                    };
                    
                    // Verificar quais campos existem
                    Object.keys(camposForm).forEach(key => {
                        if (!camposForm[key]) {
                            console.error(`Campo '${key}' não encontrado no formulário`);
                        }
                    });
                    
                    // Preencher o campo de marca se existir
                    if (camposForm.marca && data.marca) {
                        console.log(`Definindo marca: ${data.marca}`);
                        camposForm.marca.value = data.marca.toLowerCase();
                        
                        // Disparar evento de change para carregar os modelos
                        const event = new Event('change');
                        camposForm.marca.dispatchEvent(event);
                    }
                    
                    // Pequeno timeout para garantir que os modelos foram carregados
                    setTimeout(() => {
                        // Preencher o campo de modelo
                        if (camposForm.modelo && data.modelo) {
                            console.log(`Definindo modelo: ${data.modelo}`);
                            
                            // Adicionar o modelo se não existir nas opções
                            let modeloExiste = false;
                            for (let i = 0; i < camposForm.modelo.options.length; i++) {
                                const opt = camposForm.modelo.options[i];
                                if (opt.value.toLowerCase() === data.modelo.toLowerCase() || 
                                    opt.text.toLowerCase() === data.modelo.toLowerCase()) {
                                    modeloExiste = true;
                                    break;
                                }
                            }
                            
                            if (!modeloExiste) {
                                console.log("Adicionando modelo às opções:", data.modelo);
                                const option = document.createElement('option');
                                option.value = data.modelo.toLowerCase();
                                option.text = data.modelo;
                                camposForm.modelo.appendChild(option);
                            }
                            
                            camposForm.modelo.value = data.modelo.toLowerCase();
                        }
                    }, 200);
                    
                    // Preencher os outros campos se existirem
                    if (camposForm.ano) camposForm.ano.value = data.ano || '';
                    if (camposForm.versao) camposForm.versao.value = data.versao || '';
                    if (camposForm.km) camposForm.km.value = data.km || 0;
                    if (camposForm.preco) camposForm.preco.value = data.preco || 0;
                    
                    // Construir e preencher a descrição
                    if (camposForm.descricao) {
                        let descricao = `${data.marca || ''} ${data.modelo || ''} ${data.versao || ''}`;
                        descricao += data.ano ? `, Ano: ${data.ano}` : '';
                        descricao += data.km ? `, ${data.km}km` : '';
                        
                        // Checar se há informações adicionais
                        if (data.combustivel) descricao += `, Combustível: ${data.combustivel}`;
                        if (data.cambio) descricao += `, Câmbio: ${data.cambio}`;
                        if (data.cor) descricao += `, Cor: ${data.cor}`;
                        
                        camposForm.descricao.value = descricao.trim();
                    }
                })
                .catch(error => {
                    console.error('Erro ao obter dados do veículo:', error);
                    alert('Não foi possível carregar os dados do veículo. Verifique o console para mais detalhes.');
                });
        } else {
            // Limpar os campos se nenhum veículo for selecionado
            console.log("Nenhum veículo selecionado. Limpando campos.");
            const camposParaLimpar = ['marca', 'modelo', 'ano', 'versao', 'km', 'preco', 'descricao'];
            camposParaLimpar.forEach(id => {
                const campo = document.getElementById(id);
                if (campo) campo.value = '';
            });
        }
    });
    
    // Atualizar modelos ao mudar a marca
    const marcaSelect = document.getElementById('marca');
    if (marcaSelect) {
        marcaSelect.addEventListener('change', function() {
            const marca = this.value;
            console.log("Marca selecionada:", marca);
            
            const modeloSelect = document.getElementById('modelo');
            if (!modeloSelect) {
                console.error("Select de modelo não encontrado!");
                return;
            }
            
            // Limpar opções existentes
            modeloSelect.innerHTML = '<option value="">Selecione o modelo</option>';
            
            if (!marca) return;
            
            // Adicionar modelos com base na marca selecionada
            const modelosPorMarca = {
                chevrolet: ['Onix', 'Cruze', 'S10', 'Tracker', 'Prisma', 'Camaro'],
                fiat: ['Uno', 'Palio', 'Toro', 'Strada', 'Argo', 'Cronos', 'Mobi'],
                ford: ['Ka', 'Fiesta', 'Focus', 'Ranger', 'EcoSport', 'Edge'],
                honda: ['Civic', 'City', 'Fit', 'HR-V', 'WR-V', 'CR-V'],
                hyundai: ['HB20', 'Creta', 'Tucson', 'i30', 'Santa Fe'],
                toyota: ['Corolla', 'Yaris', 'Hilux', 'RAV4', 'SW4', 'Etios'],
                volkswagen: ['Gol', 'Polo', 'Golf', 'T-Cross', 'Voyage', 'Virtus', 'Jetta']
            };
            
            const modelos = modelosPorMarca[marca] || [];
            console.log("Carregando modelos para a marca:", modelos);
            
            modelos.forEach(modelo => {
                const option = document.createElement('option');
                option.value = modelo.toLowerCase();
                option.text = modelo;
                modeloSelect.appendChild(option);
            });
        });
    } else {
        console.error("Select de marca não encontrado!");
    }
    
    // Evento de mudança para o input de arquivo (imagens)
    if (fileInput) {
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
    }
    
    // Configuração dos botões do formulário
    if (publishBtn) {
        publishBtn.addEventListener('click', function() {
            const form = document.getElementById('vehicle-form');
            if (!form) {
                console.error("Formulário não encontrado!");
                return;
            }
            
            // Adicionar a ação 'publicar' para ser processada no backend
            let actionInput = form.querySelector('input[name="acao"]');
            if (!actionInput) {
                actionInput = document.createElement('input');
                actionInput.type = 'hidden';
                actionInput.name = 'acao';
                form.appendChild(actionInput);
            }
            actionInput.value = 'publicar';
        });
    }
    
    // Evento para salvar como rascunho
    const salvarBtn = document.getElementById('salvar');
    if (salvarBtn) {
        salvarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const form = document.getElementById('vehicle-form');
            if (!form) {
                console.error("Formulário não encontrado!");
                return;
            }
            
            // Adicionar a ação 'rascunho' para ser processada no backend
            let actionInput = form.querySelector('input[name="acao"]');
            if (!actionInput) {
                actionInput = document.createElement('input');
                actionInput.type = 'hidden';
                actionInput.name = 'acao';
                form.appendChild(actionInput);
            }
            actionInput.value = 'rascunho';
            
            form.submit();
            
            // Mostrar mensagem de sucesso temporariamente
            if (successMessage) {
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            }
        });
    }
    
    console.log("Inicialização do script concluída");
});

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
    console.log("DOM carregado - iniciando scripts");
    
    const imageUpload = document.getElementById('image-upload');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const publishBtn = document.getElementById('publicar');
    const successMessage = document.getElementById('success-message');
    const veiculoSelect = document.getElementById('veiculo');
    
    // Verificar se o select de veículos existe
    if (!veiculoSelect) {
        console.error("Elemento select 'veiculo' não encontrado!");
        return;
    }
    
    console.log("Select de veículos encontrado:", veiculoSelect);
    console.log("Opções disponíveis:", veiculoSelect.options.length);
    
    // Evento de clique para o upload de imagens
    if (imageUpload) {
        imageUpload.addEventListener('click', function() {
            fileInput.click();
        });
    }
    
    // Evento de mudança no select de veículos
    veiculoSelect.addEventListener('change', function() {
        const veiculoId = this.value;
        console.log("Veículo selecionado:", veiculoId);
        
        if (veiculoId) {
            // Fazer uma requisição para obter os dados do veículo
            const url = `/veiculo/${veiculoId}`;
            console.log("Fazendo requisição para:", url);
            
            fetch(url)
                .then(response => {
                    console.log("Status da resposta:", response.status);
                    if (!response.ok) {
                        throw new Error(`Erro na requisição: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Dados recebidos:", data);
                    
                    // Verificar todos os campos do formulário antes de preencher
                    const camposForm = {
                        marca: document.getElementById('marca'),
                        modelo: document.getElementById('modelo'),
                        ano: document.getElementById('ano'),
                        versao: document.getElementById('versao'),
                        km: document.getElementById('km'),
                        preco: document.getElementById('preco'),
                        descricao: document.getElementById('descricao')
                    };
                    
                    // Verificar quais campos existem
                    Object.keys(camposForm).forEach(key => {
                        if (!camposForm[key]) {
                            console.error(`Campo '${key}' não encontrado no formulário`);
                        }
                    });
                    
                    // Preencher o campo de marca se existir
                    if (camposForm.marca && data.marca) {
                        console.log(`Definindo marca: ${data.marca}`);
                        camposForm.marca.value = data.marca.toLowerCase();
                        
                        // Disparar evento de change para carregar os modelos
                        const event = new Event('change');
                        camposForm.marca.dispatchEvent(event);
                    }
                    
                    // Pequeno timeout para garantir que os modelos foram carregados
                    setTimeout(() => {
                        // Preencher o campo de modelo
                        if (camposForm.modelo && data.modelo) {
                            console.log(`Definindo modelo: ${data.modelo}`);
                            
                            // Adicionar o modelo se não existir nas opções
                            let modeloExiste = false;
                            for (let i = 0; i < camposForm.modelo.options.length; i++) {
                                const opt = camposForm.modelo.options[i];
                                if (opt.value.toLowerCase() === data.modelo.toLowerCase() || 
                                    opt.text.toLowerCase() === data.modelo.toLowerCase()) {
                                    modeloExiste = true;
                                    break;
                                }
                            }
                            
                            if (!modeloExiste) {
                                console.log("Adicionando modelo às opções:", data.modelo);
                                const option = document.createElement('option');
                                option.value = data.modelo.toLowerCase();
                                option.text = data.modelo;
                                camposForm.modelo.appendChild(option);
                            }
                            
                            camposForm.modelo.value = data.modelo.toLowerCase();
                        }
                    }, 200);
                    
                    // Preencher os outros campos se existirem
                    if (camposForm.ano) camposForm.ano.value = data.ano || '';
                    if (camposForm.versao) camposForm.versao.value = data.versao || '';
                    if (camposForm.km) camposForm.km.value = data.km || 0;
                    if (camposForm.preco) camposForm.preco.value = data.preco || 0;
                    
                    // Construir e preencher a descrição
                    if (camposForm.descricao) {
                        let descricao = `${data.marca || ''} ${data.modelo || ''} ${data.versao || ''}`;
                        descricao += data.ano ? `, Ano: ${data.ano}` : '';
                        descricao += data.km ? `, ${data.km}km` : '';
                        
                        // Checar se há informações adicionais
                        if (data.combustivel) descricao += `, Combustível: ${data.combustivel}`;
                        if (data.cambio) descricao += `, Câmbio: ${data.cambio}`;
                        if (data.cor) descricao += `, Cor: ${data.cor}`;
                        
                        camposForm.descricao.value = descricao.trim();
                    }
                })
                .catch(error => {
                    console.error('Erro ao obter dados do veículo:', error);
                    alert('Não foi possível carregar os dados do veículo. Verifique o console para mais detalhes.');
                });
        } else {
            // Limpar os campos se nenhum veículo for selecionado
            console.log("Nenhum veículo selecionado. Limpando campos.");
            const camposParaLimpar = ['marca', 'modelo', 'ano', 'versao', 'km', 'preco', 'descricao'];
            camposParaLimpar.forEach(id => {
                const campo = document.getElementById(id);
                if (campo) campo.value = '';
            });
        }
    });
    
    // Atualizar modelos ao mudar a marca
    const marcaSelect = document.getElementById('marca');
    if (marcaSelect) {
        marcaSelect.addEventListener('change', function() {
            const marca = this.value;
            console.log("Marca selecionada:", marca);
            
            const modeloSelect = document.getElementById('modelo');
            if (!modeloSelect) {
                console.error("Select de modelo não encontrado!");
                return;
            }
            
            // Limpar opções existentes
            modeloSelect.innerHTML = '<option value="">Selecione o modelo</option>';
            
            if (!marca) return;
            
            // Adicionar modelos com base na marca selecionada
            const modelosPorMarca = {
                chevrolet: ['Onix', 'Cruze', 'S10', 'Tracker', 'Prisma', 'Camaro'],
                fiat: ['Uno', 'Palio', 'Toro', 'Strada', 'Argo', 'Cronos', 'Mobi'],
                ford: ['Ka', 'Fiesta', 'Focus', 'Ranger', 'EcoSport', 'Edge'],
                honda: ['Civic', 'City', 'Fit', 'HR-V', 'WR-V', 'CR-V'],
                hyundai: ['HB20', 'Creta', 'Tucson', 'i30', 'Santa Fe'],
                toyota: ['Corolla', 'Yaris', 'Hilux', 'RAV4', 'SW4', 'Etios'],
                volkswagen: ['Gol', 'Polo', 'Golf', 'T-Cross', 'Voyage', 'Virtus', 'Jetta']
            };
            
            const modelos = modelosPorMarca[marca] || [];
            console.log("Carregando modelos para a marca:", modelos);
            
            modelos.forEach(modelo => {
                const option = document.createElement('option');
                option.value = modelo.toLowerCase();
                option.text = modelo;
                modeloSelect.appendChild(option);
            });
        });
    } else {
        console.error("Select de marca não encontrado!");
    }
    
    // Evento de mudança para o input de arquivo (imagens)
    if (fileInput) {
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
    }
    
    // Configuração dos botões do formulário
    if (publishBtn) {
        publishBtn.addEventListener('click', function() {
            const form = document.getElementById('vehicle-form');
            if (!form) {
                console.error("Formulário não encontrado!");
                return;
            }
            
            // Adicionar a ação 'publicar' para ser processada no backend
            let actionInput = form.querySelector('input[name="acao"]');
            if (!actionInput) {
                actionInput = document.createElement('input');
                actionInput.type = 'hidden';
                actionInput.name = 'acao';
                form.appendChild(actionInput);
            }
            actionInput.value = 'publicar';
        });
    }
    
    // Evento para salvar como rascunho
    const salvarBtn = document.getElementById('salvar');
    if (salvarBtn) {
        salvarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const form = document.getElementById('vehicle-form');
            if (!form) {
                console.error("Formulário não encontrado!");
                return;
            }
            
            // Adicionar a ação 'rascunho' para ser processada no backend
            let actionInput = form.querySelector('input[name="acao"]');
            if (!actionInput) {
                actionInput = document.createElement('input');
                actionInput.type = 'hidden';
                actionInput.name = 'acao';
                form.appendChild(actionInput);
            }
            actionInput.value = 'rascunho';
            
            form.submit();
            
            // Mostrar mensagem de sucesso temporariamente
            if (successMessage) {
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            }
        });
    }
    
    console.log("Inicialização do script concluída");
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