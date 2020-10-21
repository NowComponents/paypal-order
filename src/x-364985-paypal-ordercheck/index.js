import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
//import styles from './styles.scss';
import paypalStyle from './paypalStyle.scss'
import '@servicenow/now-input';
import '@servicenow/now-button';
import '@servicenow/now-loader';
import axios from 'axios';




function view(state, helpers) {
	const { properties, orderStatus, orderValue, ordererEmail, orderCurrency } = state;
	const { dispatch, updateState } = helpers;
	return (

	<div> <h2>Paypal Order Information </h2>
			<div>
				<now-input label="Paypal order ID" messages={[]} placeholder="" step="any" type="text" value=""></now-input><br />
				<now-button label="Get order infos" variant="secondary-positive" size="md" icon="address-card-fill" configAria={{}} tooltipContent="" onclick={(e) => { dispatch('GET_ORDER_DETAILS'), e } }></now-button>
				
			</div>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Orderer</th>
							<th>Status</th>
							<th>Value</th>
							<th>Currency</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>{ordererEmail}</td>
							<td>{orderStatus}</td>
							<td>{orderValue}</td>
							<td>{orderCurrency}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
createCustomElement('x-364985-paypal-ordercheck', {
	renderer: {type: snabbdom},
	view,
	properties: {

	},
	initialState: {
		orderId : '',
		orderStatus: '',
		orderValue: '',
		ordererEmail: '',
		orderCurrency: '',
	},
	actionHandlers:{
		'NOW_INPUT#VALUE_SET': (coeffects) => {
			const { updateState } = coeffects;
			const { value } = coeffects.action.payload;
			console.log('value ' + value);
			if(value !== ''){
				updateState({orderId: value})
			}
		},

		'GET_ORDER_DETAILS': (coeffects) => {
			const { state } = coeffects;
			const { orderId } = state;
			const { updateState } = coeffects;

			//first get the token
			axios ({
				method: 'post',
				url: 'https://api.sandbox.paypal.com/v1/oauth2/token',
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				auth: {
					username: '', //clientID
					password: '' //client secret
				  },
				data: 'grant_type=client_credentials',
			})
			.then((response) => {
				console.log(response);
				let statusCode = response.status;
				let accessToken = response.data.access_token;
				
				axios({
					method: 'get',
					url: 'https://api.sandbox.paypal.com/v2/checkout/orders/'+orderId,
					headers: {
						"Content-Type": "application/json",
						'Authorization': 'Bearer '+accessToken
					}

				}).then((response) => {
					console.log('order response: '+ JSON.stringify(response));
					const {status} = response.data;
					console.log('status '+ status);
					let currencyCode = response.data.purchase_units[0].amount.currency_code;
					let ordVal = response.data.purchase_units[0].amount.value;
					let ordEmail = response.data.purchase_units[0].payee.email_address;
					updateState({
						orderStatus: status,
						orderCurrency: currencyCode,
						orderValue: ordVal,
						ordererEmail: ordEmail

					})

				},(error) => {console.log(error)});


			}, (error) => {	
				console.log(error);
			});
		}
	},
	styles: paypalStyle
});
