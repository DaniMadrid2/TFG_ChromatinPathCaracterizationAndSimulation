#version 300 es
precision highp float;

uniform sampler2D positionTexture;
uniform float dt;//we have to add dt to the speed to make it frame rate independent

out vec2 position;
void main() {

  //this fragment shader will have the position texture width and height
  //first get the i'th position and make it go away from the other points
  //and make it rotate clockwise towards the center of the points with
  //a speed depending on the distance to the center of the points
  //the center of the points is the average of the positions of the points
  //the distance to the center of the points is the distance from the position to the center of the points
  //the speed is a function of the distance to the center of the points

  ivec2 texSize = textureSize(positionTexture, 0);
  vec2 uv = gl_FragCoord.xy / vec2(texSize);
  vec4 pos = texture(positionTexture, uv);

  //calculate center of points
  vec2 center = vec2(0.0);
  for(int i = 0; i < texSize.x; i++){
    for(int j = 0; j < texSize.y; j++){
      vec4 p = texelFetch(positionTexture, ivec2(i,j), 0);
      center += p.xy;
    }
  }
  center /= float(texSize.x * texSize.y);

  //calculate distance to center
  float dist = distance(pos.xy, center);

  //calculate speed
  float speed = dist * 0.1;

  //calculate angle to center
  float angle = atan(center.y - pos.y, center.x - pos.x);

  //calculate new position
  vec2 newPos = pos.xy + vec2(cos(angle), sin(angle)) * speed * dt;

  position = newPos;
}
