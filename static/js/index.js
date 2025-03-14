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
    
    // Função para mostrar mensagem de sucesso
    function mostrarMensagemSucesso(mensagem) {
        const successMessage = document.getElementById('success-message');
        if (successMessage) {
            successMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
            successMessage.style.display = 'block';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        }
    }

    // ================ NOVO CÓDIGO - BOTÃO PUBLICAR ================
    // Configuração do botão publicar com ajustes para salvar no MongoDB
    if (publishBtn) {
        publishBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Botão publicar clicado");
            
            const form = document.getElementById('vehicle-form');
            if (!form) {
                console.error("Formulário não encontrado!");
                return;
            }
            
            // Validar campos obrigatórios
            const camposObrigatorios = ['marca', 'modelo', 'ano', 'km', 'preco'];
            let formValido = true;
            
            camposObrigatorios.forEach(campo => {
                const elemento = document.getElementById(campo);
                if (!elemento) {
                    console.error(`Campo ${campo} não encontrado`);
                    return;
                }
                
                if (!elemento.value.trim()) {
                    elemento.classList.add('invalido');
                    formValido = false;
                    console.log(`Campo ${campo} inválido`);
                } else {
                    elemento.classList.remove('invalido');
                    console.log(`Campo ${campo} válido: ${elemento.value}`);
                }
            });
            
            if (!formValido) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Criar FormData para enviar o formulário incluindo imagens
            const formData = new FormData();
            
            // Adicionar os valores dos campos ao FormDat
            formData.append('marca', document.getElementById('marca').value);
            formData.append('modelo', document.getElementById('modelo').value);
            formData.append('ano', document.getElementById('ano').value);
            formData.append('versao', document.getElementById('versao').value);
            formData.append('km', document.getElementById('km').value);
            formData.append('preco', document.getElementById('preco').value);
            formData.append('descricao', document.getElementById('descricao').value);
            // Dentro do evento do botão publicar (publishBtn.addEventListener('click', function(e) {...})
// Logo após onde adiciona o campo descricao ao formData

// Adicionar campos da ficha técnica
formData.append('combustivel', document.getElementById('combustivel') ? document.getElementById('combustivel').value : '');
formData.append('cambio', document.getElementById('cambio') ? document.getElementById('cambio').value : '');
formData.append('cor', document.getElementById('cor') ? document.getElementById('cor').value : '');
formData.append('portas', document.getElementById('portas') ? document.getElementById('portas').value : '');
formData.append('motor', document.getElementById('motor') ? document.getElementById('motor').value : '');
formData.append('potencia', document.getElementById('potencia') ? document.getElementById('potencia').value : '');
formData.append('direcao', document.getElementById('direcao') ? document.getElementById('direcao').value : '');
formData.append('final_placa', document.getElementById('final-placa') ? document.getElementById('final-placa').value : '');
formData.append('informacoes_adicionais', document.getElementById('informacoes-adicionais') ? document.getElementById('informacoes-adicionais').value : '');

// Coletar opcionais marcados
const opcionais = [];
const checkboxesIds = [
    'ar-condicionado', 'vidros-eletricos', 'travas-eletricas',
    'alarme', 'som', 'sensor-re', 'camera-re',
    'airbag', 'abs', 'couro', 'teto-solar', 'multimidia'
];

checkboxesIds.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox && checkbox.checked) {
        // Converter id (ex: 'ar-condicionado') para nome legível (ex: 'Ar Condicionado')
        const nome = id.split('-')
                       .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
                       .join(' ');
        opcionais.push(nome);
    }
});

// Adicionar opcionais como JSON string
formData.append('opcionais', JSON.stringify(opcionais));

// Depois, continue com o código existente...
            
            // Adicionar o ID do veículo, se selecionado
            const veiculoSelect = document.getElementById('veiculo');
            if (veiculoSelect && veiculoSelect.value) {
                formData.append('veiculo', veiculoSelect.value);
            }
            
            // Adicionar a ação 'publicar'
            formData.append('acao', 'publicar');
            
            // Adicionar as imagens
            const fileInput = document.getElementById('file-input');
            if (fileInput && fileInput.files.length > 0) {
                for (let i = 0; i < fileInput.files.length; i++) {
                    formData.append('imagens', fileInput.files[i]);
                }
            }
            
            console.log("Enviando dados para /salvar_anuncio");
            // Verificar os dados que estão sendo enviados
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            
            // Enviar os dados para o servidor
            fetch('/salvar_anuncio', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log("Resposta recebida:", response.status);
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Resposta do servidor:', data);
                
                if (data.sucesso) {
                    // Mostrar mensagem de sucesso
                    mostrarMensagemSucesso(`Anúncio ${data.status === 'publicado' ? 'publicado' : 'salvo'} com sucesso!`);
                    
                    // Limpar o formulário
                    form.reset();
                    
                    // Limpar as imagens
                    const previewContainer = document.getElementById('preview-container');
                    if (previewContainer) {
                        previewContainer.innerHTML = '';
                    }
                    
                    // Redirecionar para a página de gerenciamento de anúncios após salvar
                    if (data.status === 'publicado') {
                        setTimeout(() => {
                            window.location.href = '/anuncios';
                        }, 2000);
                    }
                } else {
                    alert(data.mensagem || 'Ocorreu um erro ao salvar o anúncio.');
                }
            })
            .catch(error => {
                console.error('Erro ao salvar anúncio:', error);
                alert('Não foi possível salvar o anúncio. Verifique o console para mais detalhes.');
            });
        });
    }
    
    // ================ NOVO CÓDIGO - BOTÃO SALVAR COMO RASCUNHO ================
    // Evento para salvar como rascunho
    const salvarBtn = document.getElementById('salvar');
    if (salvarBtn) {
        salvarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Botão salvar rascunho clicado");
            
            const form = document.getElementById('vehicle-form');
            if (!form) {
                console.error("Formulário não encontrado!");
                return;
            }
            
            // Criar FormData para enviar o formulário incluindo imagens
            const formData = new FormData();
            
            // Adicionar os valores dos campos ao FormData
            formData.append('marca', document.getElementById('marca').value || '');
            formData.append('modelo', document.getElementById('modelo').value || '');
            formData.append('ano', document.getElementById('ano').value || '0');
            formData.append('versao', document.getElementById('versao').value || '');
            formData.append('km', document.getElementById('km').value || '0');
            formData.append('preco', document.getElementById('preco').value || '0');
            formData.append('descricao', document.getElementById('descricao').value || '');
            
            // Adicionar o ID do veículo, se selecionado
            const veiculoSelect = document.getElementById('veiculo');
            if (veiculoSelect && veiculoSelect.value) {
                formData.append('veiculo', veiculoSelect.value);
            }
            
            // Adicionar a ação 'rascunho'
            formData.append('acao', 'rascunho');
            
            // Adicionar as imagens
            const fileInput = document.getElementById('file-input');
            if (fileInput && fileInput.files.length > 0) {
                for (let i = 0; i < fileInput.files.length; i++) {
                    formData.append('imagens', fileInput.files[i]);
                }
            }
            
            console.log("Enviando dados para /salvar_anuncio como rascunho");
            // Verificar os dados que estão sendo enviados
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            
            // Enviar os dados para o servidor
            fetch('/salvar_anuncio', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log("Resposta recebida:", response.status);
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Resposta do servidor:', data);
                
                if (data.sucesso) {
                    // Mostrar mensagem de sucesso
                    mostrarMensagemSucesso('Anúncio salvo como rascunho com sucesso!');
                } else {
                    alert(data.mensagem || 'Ocorreu um erro ao salvar o rascunho.');
                }
            })
            .catch(error => {
                console.error('Erro ao salvar rascunho:', error);
                alert('Não foi possível salvar o rascunho. Verifique o console para mais detalhes.');
            });
        });
    }
    
    console.log("Inicialização do script concluída");
});

// Estilos para campos inválidos no JavaScript 
// (para o caso de o CSS não estar carregando corretamente)
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar estilo para campos inválidos, caso não exista no CSS
    if (!document.getElementById('estilos-invalidos')) {
        const style = document.createElement('style');
        style.id = 'estilos-invalidos';
        style.textContent = `
            .form-control.invalido {
                border-color: #e74c3c !important;
                box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.25) !important;
            }
            
            .form-control.invalido:focus {
                border-color: #e74c3c !important;
            }
        `;
        document.head.appendChild(style);
    }
});