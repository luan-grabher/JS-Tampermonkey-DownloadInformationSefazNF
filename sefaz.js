/*IMPORTA BOOTSTRAP*/
addCssFile('https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css');

/*desativa função alert()*/
window.alert = function () { };
window.alert = function (text) {
    var alerta = (new Date()) + "Tentou alerta: " + text;
    return gravaNoCSVAtual(alerta);
};

/*definir variaveis*/
var
    empresa = 0, filial = 0, nro_NF = 0, especie = "", serie = 0, data = "", valor = 0.00, mdf = 0, chave = "",
    natureza = "", razao = "", produtosString = "", linha_valida = 1, possuiProdutosNaoImobilizados = false

var max_exec_ao_mesmo_tempo = 21;
var lista_de_processos = new Array(max_exec_ao_mesmo_tempo);

var link_sefaz = "http://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&tipoConteudo=XbSeqxE8pl8=";

/*função de direcionamento de codigo*/
main();
function main() {
    var url = document.URL;
    if (url.search("&linha=") > -1) { paginaRecaptchaConsultaCompleta(); }
    else if (url.search("tipoConsulta=completa") > -1) { paginaControle(); }
    else if (url.search("consultaCompleta") > -1) { paginaConsultaCompleta(); }
    else {
        //var link = "https://google.com.br";
        //window.location = link;
    }
}

/*CONSTRUTORES DE PÁGINAS*/
function paginaControle() {
    console.log(new Date());
    if (localStorage.getItem("texto_maluco") === null) {
        getPaginaImportarArquivo();
    } else {
        /*CONTINUA CONSULTA*/
        var linhas = localStorage.getItem("texto_maluco").split('\n'),
            linha = localStorage.getItem("linha");

        montaPaginaControle(function () { controleDeExecucao(); });
    }
}
function paginaRecaptchaConsultaCompleta() {
    if (localStorage.getItem("texto_maluco") === null) {
        window.open(link_sefaz, "_self");
    } else {
        try {
            var linha = getParam('linha');
            var chave_aba = getParam('nfe');

            var linha_processamento = localStorage.getItem('linha_processamento');
            if (linha_processamento === linha) {
                localStorage.removeItem('linha_processamento');
                setStatusLinha(linha, 'rodando');
            }

            var colunas = getColunasLinha(linha);
            if (verificaColunasLinha(colunas) !== false) {
                if (chave === chave_aba) {
                    /*permitir baixar rolex*/
                    waitElement("#ctl00_ContentPlaceHolder1_lblTituloPrincipal", function (e) {
                        montaPaginaRecaptcha(linha, function () { resolveRecaptcha(linha); });
                    });
                } else {
                    /*define como ok, marca no csv que a chave da linha é diferente da chave da aba e fecha aba*/
                    setStatusLinha(linha, 'ok');
                    gravaNoCSVAtual('A chave da página é diferente da chave da linha passada: ' + linha);
                    /*window.close();*/
                }
            } else {
                /*define como ok, marca no csv que chegou aqui com colunas erradas e fecha aba*/
                setStatusLinha(linha, 'ok');
                gravaNoCSVAtual('Entrou na página de recaptcha com as colunas erradas na linha ' + linha);
                /*window.close();*/
            }
        } catch (e) {
            /*define como ok, marca no csv que esse deu treta e fecha aba*/
            setStatusLinha(linha, 'ok');
            gravaNoCSVAtual('Ocorreu um erro inesperado na linha ' + linha + ": " + e);
            /*window.close();*/
        }
    }
}
function paginaConsultaCompleta() {
    if (localStorage.getItem("texto_maluco") !== null) {
        /*CONTINUA CONSULTA*/
        var linha = localStorage.getItem('linha_processamento');

        try {
            var colunas = getColunasLinha(linha);
            if (verificaColunasLinha(colunas) === true) {
                pegaDadosProdutosChave(function () {
                    localStorage.removeItem("linha_processamento");
                    setStatusLinha(linha, 'ok');
                    /*window.close();*/
                });
            } else {
                //fecha pagina
                setStatusLinha(linha, 'ok');
                localStorage.removeItem("linha_processamento");
                gravaNoCSVAtual('Colunas inválidas na pagina de recaptcha para linha ' + linha);
                /*window.close();*/
            }
        } catch (e) {
            //fecha pagina
            setStatusLinha(linha, 'ok');
            localStorage.removeItem("linha_processamento");
            gravaNoCSVAtual("Erro ao pegar info produtos linha " + linha + ":;" + e);
            /*window.close();*/
        }
    } else {
        window.open(link_sefaz, "_self");
    }
}

/*FUNÇÕES DE ESPERA*/
function esperarConfirmacaoParaSeguir(linha, fun) {
    var status = getStatusLinha(linha);
    if (status === 'rodando') {
        status = 'esperando permissao';
        $('#status_linha').text(status);
        setStatusLinha(linha, status);
    }

    if (status !== 'permitido') {
        setTimeout(function () {
            esperarConfirmacaoParaSeguir(linha, fun);
        }, 1000);
    } else {
        fun();
    }
}
function esperarLiberacaoLinha(linha, fun) {
    var status = getStatusLinha(linha);

    if (status !== 'ok') {
        setTimeout(function () {
            esperarLiberacaoLinha(linha, fun);
        }, 1000);
    } else if (status === 'ok') {
        fun();
        //return true;
    }
}

/*CONSTRUTORES DE VIEW*/
function montaPaginaImportarArquivo(fun) {
    setPageHeaders();

    /*Zera pagina*/
    $("body").html("");

    /*Div com input file*/
    var corpo = $("<div>").addClass('text-center'),
        titulo = $("<div>").text('Buscar Dados Imobilizados').addClass('badge badge-dark col-12').css('font-size', '200%'),
        div = $("<div>").html("Escolha o CSV<br>").css({ 'font-size': '140%', 'margin-top': '15%' }).addClass('badge badge-default font-weight-bold'),
        div_input = $("<div>").addClass('custom-file m-1'),
        input = $("<input>").attr({ type: 'file', id: 'chaves_csv' }).addClass('custom-file-input'),
        input_label = $("<label>").attr('for', 'chaves_csv').addClass('custom-file-label').text('Escolha o arquivo csv -->'),
        imagem_moresco = $("<img>").attr({ 'src': 'https://static.wixstatic.com/media/7ab542_617a079ca6dd43f29ed791d35751b732~mv2.png/v1/fill/w_259,h_54,al_c,q_80,usm_0.66_1.00_0.01/7ab542_617a079ca6dd43f29ed791d35751b732~mv2.webp' })
            .addClass('mx-auto d-block').css('margin-top', '15%');

    /*COFIGURAÇÃO BOOTSTRAP*/
    $(".custom-file-input").on("change", function () {
        var fileName = $(this).val().split("\\").pop();
        $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
    });
    /*CONFIGURAÇÃO BOOTSTRAP*/

    div_input.append(input);
    div_input.append(input_label);

    div.append(div_input);
    corpo.append(titulo);
    corpo.append(div);
    corpo.append(imagem_moresco);

    $("body").prepend(corpo);

    /*continua com fun��es*/
    fun();
}
function montaPaginaRecaptcha(linha, fun) {

    escondePaginaReceita();

    /*define o titulo com a linha*/
    document.title = linha;

    /*programa para recerregar pagina se exeder o tempo limite*/
    setTimeout(function () {
        location.reload();
    }, 600000);

    /*APLICA CSS no Recaptcha*/
    $('#divCentral').addClass("col-6 mt-3 float-right text-center");


    var tituloChave = $("<div>").attr('id', 'tituloChave').addClass('col-12 text-center font-weight-bold badge badge-primary').text(chave + " - Linha " + linha);

    var divStatus = $("<div>").addClass('col-4 mt-5 float-left text-center'),
        h2TituloStatus = $("<div>").addClass("").text('Status:'),
        status = $("<div>").attr('id', 'status_linha').addClass('aler alert-primary col-12 mx-auto d-block').text(getStatusLinha(linha));



    divStatus.append(h2TituloStatus);
    divStatus.append(status);


    $("body").prepend(divStatus);
    $("body").prepend(tituloChave);

    /*waitElement("#ctl00_ContentPlaceHolder1_pnlBotoes > div.g-recaptcha.mx-auto.d-block > div", function(e){
        $(e).addClass('mx-auto d-block');
    });*/

    $("body").addClass('overflow-hidden');

    fun();
}
function montaPaginaControle(fun) {
    escondePaginaReceita();
    setPageHeaders();

    /*apaga captcha para não utilizar 2captcha*/
    $('.g-recaptcha').remove();

    /*Declara os elementos*/
    var h1Titulo = $("<h1>"),
        h2Titulo = $("<h2>").addClass('mb-1'),
        titulo = $("<h1>").attr('id', 'titulozao').addClass('col-12 text-center mt-3 badge badge-dark').text('CHAVE NF-e'),
        tituloChave = $("<div>").attr('id', 'tituloChave').addClass('col-12 text-center font-weight-bold badge badge-primary').text("Moresco Baixar Dados Produtos NFe Imobilizados");

    var divInfos = $('<t>').addClass('ml-1'),
        divInicio = $('<t>').addClass('font-weight-bold').html("Inicio:<t id='tempo_inicio'></t>"),
        divTempoExec = $('<t>').addClass('font-weight-bold ml-4').html(", Executando a <t id='tempo_exec'></t>"),
        divFaltaAprox = $('<t>').addClass('font-weight-bold ml-4').html(", Falta aproximadamente <t id='falta_aprox'></t>"),
        divExecPSec = $('<t>').addClass('font-weight-bold ml-4').html(", Executando <t id='exec_p_sec'> a cada 2 minutos.</t>");

    var porcentagem = 0;
    var progress = $("<div>").addClass('progress mb-5'),
        progress_bar = $('<div>').addClass('progress-bar progress-bar-striped progress-bar-animated bg-success font-weight-bold')
            .attr('id', 'barra_progresso')
            .css('width', porcentagem + "%").text(0 + '/' + 0);

    var divBotoes = $("<div>").addClass('col-4 float-left text-center'),
        divVoltar = $("<div>").addClass('mb-2'),
        divBaixar = $("<div>").addClass('mb-2'),
        divPausar = $("<div>").addClass("mb-2"),
        divReabrirRodando = $("<div>").addClass("mb-2"),
        divBotaoIframes = $("<div>"),
        alertaStatus = $("<div>").attr("id", "status_execucao").addClass('alert'),
        alertaProcessamento = $("<div>").attr("id", "linha_processamento").addClass('alert alert-primary'),
        botaoVoltar = $("<a>").attr({ 'id': 'botaoVoltar' }).addClass('btn btn-secondary text-light col-8').text('Voltar').click(function () { resetarPesquisa(); }),
        botaoBaixar = $("<a>").attr({ 'id': 'botaoVoltar' }).addClass('btn btn-info text-light col-8').text('Baixar CSV Atual').click(function () { baixarCsvAtual(); }),
        botaoPausar = $("<a>").attr({ 'id': 'botaoPausar' }).addClass('btn btn-warning text-light col-8').text('Pausar/Executar').click(function () { trocaPausaOuExecutar(); }),
        botaoReabrirRodando = $("<a>").attr({ 'id': 'botaoReabrirRodando' }).addClass('btn btn-danger text-light col-8').text('Re-Abrir Rodando').click(function () { reabrirRodando(); }),
        botaoOcultaOuExibeIframe = $("<a>").attr({ 'id': 'botaoOcultaOuExibeIframe' }).addClass('btn btn-success text-light col-8').text('Oculta/Exibir Iframes').click(function () { trocaOcultaOuExibeIframe(); });


    var divTabela = $("<div>").addClass('col-6 float-left text-center mx-auto d-block'),
        tabela = $("<table>").addClass('table table-sm table-dark table-hover mx-auto'),
        tr_head = $("<tr>").addClass('bg-primary text-light'),
        th_linha = $("<th>").text('Linha'),
        th_chave = $("<th>").text('Chaves NF-E em processamento'),
        th_status = $("<th>").text('Status');

    var divIframes = $("<div>").attr('id', 'iframes').addClass('w-100 float-left d-none');

    /*Cria Iframes*/
    for (var i = 1; i <= max_exec_ao_mesmo_tempo; i++) {
        var iframe = $("<iframe>").attr('id', 'iframe_' + i).css({ 'width': '50%', 'height': '600px' }).text('Seu navegador não suporta iframes.');
        divIframes.append(iframe);
    }

    /*Monta tabela*/
    tr_head.append(th_linha);
    tr_head.append(th_chave);
    tr_head.append(th_status);
    tabela.append(tr_head);
    for (var i = 1; i <= max_exec_ao_mesmo_tempo; i++) {
        var tr = $("<tr>"),
            td_linha = $("<td>").attr('id', 'exe_linha_' + i).text(i),
            td_chave = $("<td>").attr('id', 'exe_chave_' + i).text(''),
            td_status = $("<td>").attr('id', 'exe_status_' + i).text('');

        tr.append(td_linha);
        tr.append(td_chave);
        tr.append(td_status);

        tabela.append(tr);
    }

    /*Encaixa os elementos*/

    divTabela.append(tabela);

    divInfos.append(divInicio);
    divInfos.append(divTempoExec);
    divInfos.append(divFaltaAprox);
    divInfos.append(divExecPSec);

    progress.append(progress_bar);

    divVoltar.append(botaoVoltar);
    divBaixar.append(botaoBaixar);
    divPausar.append(botaoPausar);
    divReabrirRodando.append(botaoReabrirRodando);
    divBotaoIframes.append(botaoOcultaOuExibeIframe);

    divBotoes.append(alertaStatus);
    divBotoes.append(alertaProcessamento);
    divBotoes.append(divVoltar);
    divBotoes.append(divBaixar);
    divBotoes.append(divPausar);
    divBotoes.append(divReabrirRodando);
    divBotoes.append(divBotaoIframes);

    h1Titulo.append(titulo);
    h2Titulo.append(tituloChave);

    /*Coloca no body*/
    $("body").prepend(divIframes);
    $("body").prepend(divTabela);
    $("body").prepend(divBotoes);
    $("body").prepend(progress);
    $("body").prepend(divInfos);
    $("body").prepend(h2Titulo);
    $("body").prepend(h1Titulo);

    /*$("body").addClass('overflow-hidden');*/

    fun();
}
function setPageHeaders() {
    /*altera  url  e titulo pagina*/
    //window.history.pushState("","", "/Moresco-TI");
    document.title = "Buscar Dados Imobilizado";
    setFavicon("https://static.wixstatic.com/media/75a4b4_1dd98c557949459f920f8de7f106450b%7Emv2.png/v1/fill/w_32%2Ch_32%2Clg_1%2Cusm_0.66_1.00_0.01/75a4b4_1dd98c557949459f920f8de7f106450b%7Emv2.png");
}
function escondePaginaReceita() {
    /*ESCONDER COISAS*/
    $('#rodape').addClass('d-none');
    $('#cabecalho').addClass('d-none');
    $('#barra-brasil').addClass('d-none');
    $('#localizacao').addClass('d-none');
    $('#zoomAcessibilidade').addClass('d-none');
    $('#barraDireita').addClass('d-none');
    $('.divTituloPrincipal').addClass('d-none');
    $('.indentacaoConteudo').addClass('d-none');
    $('.botao').addClass('d-none');
    $('#ctl00_ContentPlaceHolder1_pnlConsultas').addClass('d-none');

    /*REMOVE CSS*/
    document.querySelector("head > link[href='css/geral.css']").remove();
    document.querySelector("head > link[href='css/classes.css']").remove();
    document.querySelector("head > link[href='css/paginasInternas.css']").remove();
    document.querySelector("head > link[href='css/estilo_visualizacao.css']").remove();
}

/*CONTROLADORES DE VIEW*/
function getPaginaImportarArquivo() {
    /*NOVA CONSULTA*/
    resetarPesquisa(true);
    montaPaginaImportarArquivo(function () {
        /*IDENTIFICA arquivo*/
        $("#chaves_csv").change(function () {
            var file = document.getElementById('chaves_csv').files[0];
            readTextFile(file, function (texto_maluco) {
                localStorage.setItem("texto_maluco", texto_maluco);
                localStorage.setItem("linha", 0);
                localStorage.setItem("csvAtual", "");
                localStorage.setItem("linhas_verificadas", "");
                localStorage.setItem('status_execucao', '');
                localStorage.setItem('status_execucao', 'Executando');
                location.reload();
            });
        });
    });
}
function resolveRecaptcha(linha) {
    $("#ctl00_ContentPlaceHolder1_txtChaveAcessoCompleta").val(chave);
    waitForElementToDisplay('#ctl00_ContentPlaceHolder1_pnlBotoes > div.g-recaptcha > div > div > iframe', 1, function () {
        try {
            waitForRecaptcha(function () {
                esperarConfirmacaoParaSeguir(linha, function () {
                    $("#ctl00_ContentPlaceHolder1_btnConsultar").click();
                    /*aqui ele vai ir para pagina de consulta*/
                });
            }, 0);
        } catch (e) {
            location.reload();
        }

    });
}
function pegaDadosProdutosChave(fun) {
    waitElement("#NFe > fieldset:nth-child(1) > table > tbody > tr > td:nth-child(6) > span", function (e) {
        var valorNFe = e.innerText;
        if (valorNFe !== valor) {
            possuiProdutosNaoImobilizados = true;
        }
        waitElement("#tab_1", function (e) {
            e.click();
            waitElement("#Emitente > fieldset > table > tbody > tr.col-2 > td:nth-child(1) > span", function (e) {
                razao = e.innerText;

                waitElement("#tab_3", function (e) {
                    e.click();
                    waitElement("#Prod > fieldset > div > table.toggle.box tr", function (e) {
                        var nro_linhas = document.querySelectorAll("#Prod > fieldset > div > table.toggle.box").length;
                        produtosString = "";
                        for (var i = 1; i <= nro_linhas; i++) {
                            var selector = "#Prod > fieldset > div > table.toggle.box ";
                            var descricao = document.querySelector(selector + ".fixo-prod-serv-descricao > span").innerText;
                            var valor_prod = document.querySelector(selector + ".fixo-prod-serv-vb > span").innerText;
                            var qtd_prod = document.querySelector(selector + ".fixo-prod-serv-qtd > span").innerText;

                            gravaLinhaNoCSV(descricao, valor_prod, qtd_prod);
                            document.querySelector(selector).remove();
                        }
                        fun();
                    }, 120, function () {
                        location.reload();
                    });
                }, 120, function () {
                    location.reload();
                });
            }, 120, function () {
                location.reload();
            });
        }, 120, function () {
            location.reload();
        });
    });

}
function trocaOcultaOuExibeIframe() {
    if ($('#iframes').hasClass('d-none')) {
        $('#iframes').removeClass('d-none');
    } else {
        $('#iframes').addClass('d-none');
    }
}

/*ATUALIZAÇÃO DE VIEW*/
function viewAlertaLinhaProcessamento() {
    var linha_processamento = localStorage.getItem('linha_processamento');
    if (linhaProcessamentoLiberada() === false) {
        $("#linha_processamento").removeClass('d-none').text("Linha consultando dados: " + linha_processamento);
    } else {
        $("#linha_processamento").addClass('d-none');
    }
}
function viewAlertaStatusExecucao() {
    var status = localStorage.getItem('status_execucao');

    var color = "";
    if (status === "Executando") {
        color = "alert-info";
    } else if (status === "Pausado") {
        color = "alert-secondary";
    } else if (status === "Esperando últimos") {
        color = "alert-warning";
    } else if (status === "Finalizado") {
        color = "alert-success";
    }

    $('#status_execucao').removeClass('alert-info');
    $('#status_execucao').removeClass('alert-secondary');
    $('#status_execucao').removeClass('alert-warning');
    $('#status_execucao').removeClass('alert-success');
    $("#status_execucao").text('Status execução: ' + status).addClass(color);
}
function atualizaView() {
    viewAlertaLinhaProcessamento();
    viewAlertaStatusExecucao();

    $('#tempo_inicio').text(getTempoInicio());
    $('#tempo_exec').text(getTempoExecucao(true));
    $('#falta_aprox').text(getFaltaAproximadamente());
    $('#exec_p_sec').text(" uma linha a cada " + toHHMMSS(getVelocidadeExec()));
}

/*CONTROLE DA EXECUÇÃO ATUAL*/
function controleDeExecucao() {
    atualizaView();

    var status = localStorage.getItem('status_execucao');

    if (status === 'Executando' | status === 'Esperando últimos') {
        lista_de_processos = new Array(max_exec_ao_mesmo_tempo);

        var process_str = localStorage.getItem('processamento');
        var processos_ativos = process_str === null ? "" : process_str;
        processos_ativos = processos_ativos !== undefined ? processos_ativos.split(";") : false;



        /*Verifica se algum ja terminou, os que ja terminaram recebem o 'ok' para continuar*/
        buscarDadosNFes(processos_ativos, function () {
            /*Popula todo array process*/
            var processamento = montaListaProcessamento();
            localStorage.setItem('processamento', processamento);

            /*Atualiza barra de progresso*/
            var total_linhas = getLinhasTotais();
            $('#barra_progresso').width((getProntos() * 100 / total_linhas) + '%').text(getProntos() + '/' + total_linhas);

            if (processamento === "" & localStorage.getItem('status_execucao') === 'Esperando últimos') {
                localStorage.setItem('status_execucao', 'Finalizado');
            }
            repeteExecucao();

        });
    } else if (status === 'Pausado') {
        repeteExecucao();
    }
}
function repeteExecucao() {
    setTimeout(function () {
        controleDeExecucao();
    }, 2000);
}
function trocaPausaOuExecutar() {
    var status = localStorage.getItem('status_execucao');
    if (status === 'Executando') {
        localStorage.setItem('status_execucao', 'Pausado');
    } else if (status === 'Pausado') {
        localStorage.setItem('status_execucao', 'Executando');
    }
}

/*FUNÇÕES DE CONTROLE*/
function buscarDadosNFes(processos_ativos, fun) {
    if (processos_ativos !== false & processos_ativos !== undefined) {
        forSync(0, sizeArrayObj(processos_ativos) - 1, function (i) {
            if (processos_ativos[i] !== '' & processos_ativos[i] !== undefined) {
                var line_process = processos_ativos[i].split("#").join("");
                var st = getStatusLinha(line_process);
                if (st === "esperando permissao" & linhaProcessamentoLiberada() === true) {
                    /*permite baixar*/
                    setStatusLinha(line_process, 'permitido');
                    localStorage.setItem('linha_processamento', line_process);
                    lista_de_processos[i] = line_process;
                    return true;
                }
                else if (st !== 'ok' & st !== "") {
                    lista_de_processos[i] = line_process;
                    return true;
                }
                else {
                    adicionaQuantidadeProntos();
                    return true;
                }
            }
            else {
                return true;
            }
        }, function () {
            fun();
        });
    }
}
function montaListaProcessamento() {
    var processamento = "";
    try {
        for (var i = 0; i < lista_de_processos.length; i++) {
            proc = lista_de_processos[i];
            if (proc === undefined) {
                if (getLinha() <= getLinhasTotais()) {
                    /*console.log('Espaço ' + i + ' liberado para linha: ' + getLinha());*/
                    lista_de_processos[i] = getLinha();
                    proc = lista_de_processos[i];
                    trabalharLinha(proc, i, function () {
                        proximaLinha();
                    });
                } else {
                    localStorage.setItem('status_execucao', 'Esperando últimos');
                }
            }
            if (proc !== undefined) {
                /*Popula Tabela e monta local processamento*/
                $("#exe_linha_" + (i + 1)).text(proc);
                $("#exe_chave_" + (i + 1)).text(getChaveLinha(proc));
                $("#exe_status_" + (i + 1)).text(getStatusLinha(proc));

                processamento += processamento === "" ? "" : ";";
                processamento += "#" + proc + "#";
            } else {
                $("#exe_linha_" + (i + 1)).text("");
                $("#exe_chave_" + (i + 1)).text("");
                $("#exe_status_" + (i + 1)).text("");
            }
        }
    } catch (e) {
        console.log('[ALERTA]Erro ao montar lista de processamento: ' + e);
    }
    return processamento;
}
function trabalharLinha(linha, linha_tabela, fun) {
    /*trabalha linha -  verifica se linha é valida, se for  abre aba e seta local storage*/
    try {
        var colunas = getColunasLinha(linha);
        if (colunas.length >= 10) {
            var colunaValida = verificaColunasLinha(colunas, true);
            if (colunaValida === true) {
                var abrir_link = link_sefaz + "&nfe=" + chave + "&linha=" + linha;
                /*window.open(abrir_link);*/
                $("#iframe_" + (linha_tabela + 1)).attr('src', abrir_link);
                setStatusLinha(linha, 'rodando');
            } else {
                if (colunaValida === "repetido") {
                    razao = "NFE REPETIDA, PRODUTOS JÁ ANOTADOS!";
                    gravaLinhaNoCSV("", "");
                    setStatusLinha(linha, 'ok');
                } else {
                    gravaNoCSVAtual("Na linha " + linha + " as colunas estão com valores inválidos!");
                    setStatusLinha(linha, 'ok');
                }
            }
        } else {
            gravaNoCSVAtual("Linha " + linha + " tem menos de 10 colunas. Linha Inválida.");
            setStatusLinha(linha, 'ok');
        }

    } catch (e) {
        gravaNoCSVAtual("Erro inesperado ao trabalhar com a linha " + linha + ": " + e);
        setStatusLinha(linha, 'ok');
    }

    fun();
}
function reabrirRodando() {
    var process_str = localStorage.getItem('processamento');
    var processos_ativos = process_str === null ? "" : process_str;
    processos_ativos = processos_ativos !== undefined ? processos_ativos.split(";") : false;

    if (processos_ativos !== null & processos_ativos !== undefined & processos_ativos !== false) {
        for (var i = 0, max = processos_ativos.length; i < max; i++) {
            trabalharLinha(processos_ativos[i].split("#").join(""), i + 1, function () { });
        }
    }
}

/*GETTERS*/
function getStatusLinha(linha) {
    var status_linha = localStorage.getItem('linha_proc' + linha);
    return status_linha === undefined ? "" : status_linha;
}
function getProntos() {
    return Number(localStorage.getItem('qtd_prontos'));
}
function getLinha() {
    var n = Number(localStorage.getItem('linha'));
    n = isNaN(n) ? 0 : n;
    return n;
}
function getLinhas() {
    try {
        var linhas = localStorage.getItem("texto_maluco");
        return linhas.split("\n");
    } catch (e) {
        return false;
    }
}
function getLinhasTotais() {
    var linhas = localStorage.getItem("texto_maluco");
    if (linhas !== undefined) {
        linhas = linhas.split('\n');
        var tam = 0;
        try {
            tam = linhas.length;
        } catch (e) { }
        return tam;
    } else {
        return 0;
    }
}
function getColunasLinha(linha) {
    try {
        var linhas = getLinhas();
        return linhas[linha].split(";");
    } catch (e) {
        return false;
    }
}
function getChaveLinha(linha) {
    try {
        var colunas = getColunasLinha(linha);
        return colunas[8];
    } catch (e) {
        return "Chave inválida!";
    }
}
function getTempoInicio() {
    var i = localStorage.getItem('tempo_inicio');
    if (i !== "" & i !== undefined & i !== null) {
        return i;
    } else {
        var d = new Date();

        var mes = d.getMonth() + 1;
        mes = mes < 10 ? "0" + mes : mes;

        var dia = d.getDate();
        dia = dia < 10 ? "0" + dia : dia;

        var ano = d.getFullYear();

        var hora = d.getHours();
        var minuto = d.getMinutes();
        minuto = minuto < 10 ? "0" + minuto : minuto;
        var sec = d.getSeconds();
        sec = sec < 10 ? "0" + sec : sec;

        i = ano + "-" + mes + "-" + dia + " " + hora + ":" + minuto + ":" + sec;
        localStorage.setItem('tempo_inicio', i);
        return i;
    }
}
function getTempoExecucao(format) {
    var inicio_str = getTempoInicio();
    var inicio = new Date(inicio_str);
    var now = new Date();

    var dif = Math.round((now.getTime() - inicio.getTime()) / 1000);

    if (format === true) {
        return toHHMMSS(dif);
    } else {
        return dif;
    }
}
function getVelocidadeExec() {
    return getTempoExecucao() / getProntos();
}
function getFaltaAproximadamente() {
    return toHHMMSS(getVelocidadeExec() * (getLinhasTotais() - getProntos()));
}
function getExecutaACada2Minutos() {
    return Math.round(120 / getVelocidadeExec());
}

/*SETTERS*/
function setStatusLinha(linha, status) {
    localStorage.setItem('linha_proc' + linha, status);
}

/*VALIDAÇÃO*/
function linhaProcessamentoLiberada() {
    var linha_processamento = localStorage.getItem('linha_processamento');
    if (linha_processamento === "" | linha_processamento === undefined | linha_processamento === null) {
        return true;
    } else {
        return false;
    }
}
function verificaColunasLinha(colunas, verificaJaInserido) {
    try {
        empresa = Number(colunas[0]);
        filial = Number(colunas[1]);
        nro_NF = Number(colunas[2]);
        especie = colunas[3];
        serie = Number(colunas[4]);
        data = colunas[5];
        valor = colunas[6];
        mdf = Number(colunas[7]);
        chave = colunas[8];
        natureza = Number(colunas[9]);

        if (isNaN(empresa) | isNaN(filial) | isNaN(nro_NF) | isNaN(serie) | isNaN(mdf) | isNaN(natureza)) {
            return false;
        } else {
            if (natureza === 1551 | natureza === 2551 | natureza === 1406 | natureza === 2406) {
                if (verificaJaInserido === true) {
                    var linhas_verificadas = localStorage.getItem("linhas_verificadas");
                    if (linhas_verificadas.search("#" + chave + "#") > -1) {
                        return "repetido";
                    } else {
                        localStorage.setItem("linhas_verificadas", localStorage.getItem("linhas_verificadas") + "#" + chave + "#");
                        return true;
                    }
                } else {
                    return true;
                }
            } else {
                return false;
            }
        }
    } catch (e) {
        return false;
    }
}

/*CONTROLE DO PONTO DE EXECUÇÃO*/
function adicionaQuantidadeProntos() {
    var qtd_prontos = Number(localStorage.getItem('qtd_prontos'));
    qtd_prontos++;
    localStorage.setItem('qtd_prontos', Number(qtd_prontos));
}
function proximaLinha() {
    var linha = getLinha();
    linha++;
    localStorage.setItem('linha', Number(linha));
}
function vaiParaProximaLinha(linha) {
    linha++;
    localStorage.setItem('linha', Number(linha));
    location.reload();
}

/*ITENS DA PESQUISA ATUAL*/
function resetarPesquisa(no_reload_page) {
    localStorage.removeItem('linha');
    localStorage.removeItem('linha_processamento');
    localStorage.removeItem('texto_maluco');
    localStorage.removeItem('csvAtual');
    localStorage.removeItem('processamento');
    localStorage.removeItem('qtd_prontos');
    localStorage.removeItem('tempo_inicio');
    localStorage.removeItem('linhas_verificadas');
    localStorage.removeItem('status_execucao');
    if (no_reload_page !== true) {
        location.reload();
    }
}
function gravaLinhaNoCSV(descricao, valor_prod, qtd_prod) {
    var linha_csv = empresa + ";";
    linha_csv += filial + ";";
    linha_csv += nro_NF + ";";
    linha_csv += especie + ";";
    linha_csv += serie + ";";
    linha_csv += data + ";";
    linha_csv += valor + ";";
    linha_csv += mdf + ";";
    linha_csv += chave + ";";
    linha_csv += natureza + ";";

    linha_csv += (razao.split(";").join(" ")) + ";";

    if (qtd_prod !== undefined) {
        linha_csv += "(" + qtd_prod.toString().split(",0000").join("") + " Itens) - ";

    }
    linha_csv += (descricao.split(";").join(" ")) + ";";

    linha_csv += valor_prod;

    if (possuiProdutosNaoImobilizados === true) {
        linha_csv += ";" + "ATENÇÃO: NEM TODOS OS PRODUTOS DESSA NF SÃO IMOBILIZADOS!";
    }

    gravaNoCSVAtual(linha_csv);
}
function gravaNoCSVAtual(texto) {
    var csv_atual = localStorage.getItem("csvAtual");
    csv_atual += csv_atual === "" ? "" : "\n";
    csv_atual += texto;
    localStorage.setItem("csvAtual", csv_atual);
    return true;
}
function baixarCsvAtual() {
    var textoCsv = localStorage.getItem("csvAtual");
    download('Produtos de Nfe Imobilizados.csv', textoCsv);
}
