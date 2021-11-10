import React from "react";

//const ETH = 1000000000000000000;
let dstatus1 = false;
let rstatus2 = false;

export function Transfer({ transferTokens, tokenSymbol }) {
  return (
    <div>
      <h4>Deposit or Redeem</h4>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const to = formData.get("to");
          const amount = formData.get("amount");

          //if (to && amount) {
          if (to && amount && (dstatus1 || rstatus2) && (!(dstatus1 === rstatus2))) {
            transferTokens(to, amount, dstatus1);
            console.log("status: ", dstatus1, rstatus2);
          } else
            alert('Please select either "Deposit" or "Redeem" to proceed, thanks.');
        }}
      >
        <div className="form-group">
          <label>Amount of {tokenSymbol}</label>
          <input
            className="form-control"
            type="number"
            step="0.01"
            name="amount"
            placeholder="1"
            required
          />
        </div>
        <div className="form-group">
          <label>Recipient address</label>
          <input className="form-control" type="text" name="to" required />
        </div>
        <div className="form-group">
          <label htmlFor="myCheck">Deposit : </label>
          <input type="checkbox" id="myCheck" onClick={_myFunction}></input>
        </div>
        <div className="form-group">
          <label htmlFor="myCheck2">Redeem : </label>
          <input type="checkbox" id="myCheck2" onClick={_myFunction2}></input>
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Transact" />
        </div>
      </form>
    </div>
  );
}

function _myFunction() {
  console.log('Click happened on "Deposit" Checkbox');
  if (!dstatus1)
    dstatus1 = true;
  else
    dstatus1 = false;
  console.log('Click Status 1: ', dstatus1);
}

function _myFunction2() {
  console.log('Click happened on "Redeem" Checkbox');
  if (!rstatus2)
    rstatus2 = true;
  else
    rstatus2 = false;
  console.log('Click Status 2', rstatus2);
}
