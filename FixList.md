# Lista de Bugs ou Fix Necessarios
> ( Essa lista nao tem uma ordem correta )

### Geral

* Criação de um botao de voltar (Padronizado para ser usado em todas as telas)

* Padronização de cores

* alinhamento padronizado 

### HomePage

* ~~O search da HomePage~~ 
```bash 
src/app/shared/components/search-home/search-home.html
```

* Melhoria na homepage quando logado

### Admin

* Repensar no Fluxo de conversao para admin (Principalmente na tela de Select-role)
```bash 
src/app/features/auth/pages/select-role/select-role.html
```
* ~~Resolver o que vai fazer com o Visao Geral~~

* Arumar/Definir um visual para o a tela de horarios

* Tela de Reserva (Visualizar as reservas)

    * ~~Adicionar a API do Whatsapp na tela de reserva junto com talvez um botao para copiar o numero telefonico~~

    * ~~Adicionar talvez um botao para se comunicar via Email~~
    
    * ~~Arrumar/Melhorar as informações da parte de açoes~~ 

    * Arrumar os filtros


* ~~Ajeitar o visual da tela de configuraçoes do clube (talvez deixar parecido com o visual do editar usuario)~~

* ~~Arrumar os link do bread-crumb~~
```bash
src/app/shared/components/bread-crumb/bread-crumb.html
```

* Adicionar um visual para poder editar as imagens do clube e quadra

### Pós Pagamento
* visual da tela pós pagamentos
* tela de planos

### Planos
* Definir visual
* Definir local da tela
* Colocar travas de planos

### Detalhes clubes
* reorganizar lugar dos elementos


---

# Fix's do Gustavo


### Homepage

* ~~erro de nao autorizado, na home page~~ 
* ~~logo~~ 
* ~~o botao de entrar esta no como lista~~ 
* ~~baner precisa de atenção pois nao envia voce para lugar nenhum (colocar o cadrastrar talvez)~~
* ~~problemas de resposividade~~
* ~~informaçoes sobre nao ter clube ( esconder/tirar )~~
* ~~tornar a logo ficar com o cursor do tipo poiter~~
* ~~primeiro nome~~
* ~~links footer~~

### Login 

- erros no console ( diversos ) 

### Clubs/Court-list

- responsividade no botao de filtrar
- ~~sem roda-pé~~

### Cadastrar

- ~~tem que ter atençao nas proibições de caracteres especiais~~ 
- ~~revelar as condiçoes sobre a senha antes de ela tentar criar a senha~~ 
- ~~cpf e data de nascimento (eu n quero fazer isso )~~

### Email

- ~~deixar bonito~~
- ~~nao redirecionar~~ 

### User 

- apelido particular (unico) 

##### Barra de pesquisa 

- ~~sla o que nois vai fazer com isso aqui~~

### Clube details

- erros no console 

--- 