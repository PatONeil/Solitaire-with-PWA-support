<?php
	$name 		= $_REQUEST['name']; 
	$email 		= $_REQUEST['email'];
	$comment	= $_REQUEST['message'];
	$duration	= $_REQUEST['duration'];
	$numberOfTurnCards 		= $_REQUEST['numberOfTurnCards'];
	$numberOfTurnsAllowed 	= $_REQUEST['numberOfTurnsAllowed'];
	$tmp_name 	= $_FILES['deck']['tmp_name'];
	$to = 'oneilpatr@gmail.com'; 
	$subject = 'Solitaire Comments'; 
	//$random_hash = md5(date('r', time())); 
	$headers = "From: pjoneil@pjoneil.net\r\nReply-To: oneilpatr@gmail.com"; 
	$headers .= "\r\nContent-Type: multipart/mixed; boundary=\"00000000000040ddc3061ebe1b96\""; 
	$attachment = chunk_split(base64_encode(file_get_contents($tmp_name))); 

	//define the body of the message. 
	$message = <<<EOF

--00000000000040ddc3061ebe1b96
Content-Type: multipart/alternative; boundary="00000000000040ddc2061ebe1b94"

--00000000000040ddc2061ebe1b94
Content-Type: text/plain; charset="UTF-8"

From: {$name}
Email: {$email}
Speed: {$duration}
numberOfTurnCards: {$numberOfTurnCards}
numberOfTurnsAllowed: {$numberOfTurnsAllowed}
Comment: {$comment}

--00000000000040ddc2061ebe1b94
Content-Type: text/html; charset="UTF-8"

<table>
<tr><td>From:</td><td>{$name}</td></tr> 
<tr><td>Email:</td><td>{$email}</td></tr> 
<tr><td>Speed:</td><td>{$duration}</td></tr> 
<tr><td>numberOfTurnCards:</td><td>{$numberOfTurnCards}</td></tr> 
<tr><td>numberOfTurnsAllowed:</td><td>{$numberOfTurnsAllowed}</td></tr> 
<tr><td>Comment:</td><td>{$comment}</td></tr> 
</table>
--00000000000040ddc2061ebe1b94--
--00000000000040ddc3061ebe1b96
Content-Type: image/png; name="undo.png"
Content-Disposition: attachment; filename="deck.txt"
Content-Transfer-Encoding: base64
X-Attachment-Id: f_lzdicigg0
Content-ID: <f_lzdicigg0>

{$attachment}
--00000000000040ddc3061ebe1b96--
EOF;

//send the email  
$mail_sent = @mail( $to, $subject, $message, $headers ); 
echo "mail sent";
?>